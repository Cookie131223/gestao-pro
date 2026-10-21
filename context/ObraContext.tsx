import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { getGestaoData, saveGestaoData, SyncConflictError } from '../lib/supabase-api';
import { mergeSnapshots } from '../lib/merge-snapshots';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  responsavel: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  inicio: string;
  prazo: string;
}

export interface Material {
  id: string;
  nome: string;
  quantidade: string;
  valor: number;
}

export interface Obra {
  id: string;
  nome: string;
  status: 'Em Andamento' | 'Atrasada' | 'Concluída';
  statusColor: string;
  cliente: string;
  endereco: string;
  fase: string;
  progresso: number;
  inicio: string;
  previsao: string;
  orcamento: number;
  gasto: number;
  borderColor: string;
  tarefas: Tarefa[];
  materiais: Material[];
  fotos: string[];
}

interface ObraContextType {
  obras: Obra[];
  loading: boolean;
  syncing: boolean;
  lastSync: Date | null;
  syncError: string | null;
  retrySync: () => void;
  syncConflicts: number;
  resolveSync: (prefer: 'local' | 'remote') => void;
  adicionarObra: (obra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => void;
  adicionarTarefa: (obraId: string, tarefa: Omit<Tarefa, 'id'>) => void;
  adicionarMaterial: (obraId: string, material: Omit<Material, 'id'>) => void;
  adicionarFoto: (obraId: string, fotoUri: string) => void;
  atualizarStatusTarefa: (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => void;
}

function createId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const ObraContext = createContext<ObraContextType | undefined>(undefined);

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const { session, getAccessToken } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncConflicts, setSyncConflicts] = useState(0);
  const latest = useRef<Obra[]>([]);
  const baseline = useRef<Obra[] | null>(null);
  const busy = useRef(false);
  const owner = useRef(session?.user.id);
  const tokenGetter = useRef(getAccessToken);
  tokenGetter.current = getAccessToken;
  owner.current = session?.user.id;
  const generation = useRef(0);
  const localQueue = useRef<Promise<void>>(Promise.resolve());
  const conflictCount = useRef(0);
  const storageKey = session?.user.id ? `@obramax:obras:${session.user.id}` : null;

  function cache(key: string, next: Obra[], base: Obra[] | null, pending: boolean) {
    // One envelope keeps the local snapshot and its merge baseline together.
    localQueue.current = localQueue.current.catch(() => {}).then(async () => {
      await AsyncStorage.setItem(`${key}:snapshot`, JSON.stringify({ obras: next, base, pending }));
      await AsyncStorage.setItem(key, JSON.stringify(next));
      if (!pending) await AsyncStorage.removeItem(`${key}:pending`);
    });
    return localQueue.current;
  }

  useEffect(() => {
    const epoch = ++generation.current;
    let active = true;
    busy.current = false;
    conflictCount.current = 0;
    baseline.current = null;
    latest.current = [];
    setObras([]);
    setSyncing(false);
    setSyncConflicts(0);
    setLastSync(null);
    setSyncError(null);
    setLoading(true);
    void (async () => {
      if (!storageKey || !owner.current) { setLoading(false); return; }
      const userId = owner.current;
      try {
        await localQueue.current.catch(() => {});
        const raw = await AsyncStorage.getItem(`${storageKey}:snapshot`);
        const snapshot = raw ? JSON.parse(raw) : null;
        const legacyPending = await AsyncStorage.getItem(`${storageKey}:pending`);
        if (!active) return;
        if (snapshot?.pending || legacyPending) {
          latest.current = snapshot?.pending ? snapshot.obras : JSON.parse(legacyPending!);
          baseline.current = snapshot?.pending ? snapshot.base : null;
          setObras(latest.current);
          setSyncError('Há alterações locais pendentes. Tente sincronizar novamente.');
          return;
        }
        const remote = await getGestaoData(await tokenGetter.current(), userId);
        if (!active) return;
        latest.current = remote?.obras || [];
        baseline.current = latest.current;
        setObras(latest.current);
        setLastSync(remote?.updated_at ? new Date(remote.updated_at) : null);
        await cache(storageKey, latest.current, baseline.current, false);
      } catch {
        const raw = await AsyncStorage.getItem(`${storageKey}:snapshot`).catch(() => null);
        const local = await AsyncStorage.getItem(storageKey).catch(() => null);
        if (active) {
          const snapshot = raw ? JSON.parse(raw) : null;
          latest.current = snapshot?.obras || (local ? JSON.parse(local) : []);
          baseline.current = snapshot?.base ?? null;
          setObras(latest.current);
          setSyncError('Não foi possível carregar os dados da nuvem. Verifique a conexão.');
        }
      } finally {
        if (active && generation.current === epoch) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session?.user.id, storageKey]);

  async function synchronize(prefer?: 'local' | 'remote') {
    if (busy.current || !storageKey || !owner.current) return;
    const epoch = generation.current;
    const userId = owner.current;
    const current = () => generation.current === epoch && owner.current === userId;
    busy.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        await localQueue.current;
        if (!current()) return;
        const token = await tokenGetter.current();
        const remote = await getGestaoData(token, userId);
        if (!current()) return;
        const remoteObras = (remote?.obras || []) as Obra[];
        const before = latest.current;
        const result = baseline.current === null && remoteObras.length > 0
          ? { value: prefer === 'remote' ? remoteObras : before, conflicts: ['legacy'] }
          : mergeSnapshots(baseline.current || [], before, remoteObras, prefer);
        if (result.conflicts.length && !prefer) {
          conflictCount.current = result.conflicts.length;
          setSyncConflicts(conflictCount.current);
          setSyncError(baseline.current === null
            ? 'Esta cópia local é antiga e não tem histórico para combinar. Escolha entre manter a versão deste dispositivo ou a versão da nuvem.'
            : 'O mesmo conteúdo foi alterado em outro dispositivo. Escolha quais alterações manter. As demais serão combinadas.');
          return;
        }
        let revision: string;
        try {
          revision = await saveGestaoData(token, userId, result.value, remote?.updated_at ?? null);
        } catch (error) {
          if (error instanceof SyncConflictError) continue;
          throw error;
        }
        if (!current()) return;
        // Preserve edits made while the network request was in progress.
        const moreEdits = latest.current !== before;
        const rebased = moreEdits ? mergeSnapshots(before, latest.current, result.value, prefer) : { value: result.value, conflicts: [] };
        const previousBaseline = baseline.current;
        baseline.current = rebased.conflicts.length && !prefer ? previousBaseline : result.value;
        latest.current = rebased.value;
        setObras(latest.current);
        setLastSync(new Date(revision));
        conflictCount.current = rebased.conflicts.length;
        setSyncConflicts(conflictCount.current);
        await cache(storageKey, latest.current, baseline.current, moreEdits);
        if (!current()) return;
        if (rebased.conflicts.length && !prefer) {
          setSyncError('Há alterações simultâneas para revisar antes de continuar.');
          return;
        }
        setSyncError(null);
        if (!moreEdits && latest.current === rebased.value) return;
      }
      setSyncError('Os dados continuam mudando em outro dispositivo. Suas alterações estão salvas neste dispositivo; tente novamente.');
    } catch (error) {
      if (current()) setSyncError(error instanceof Error ? error.message : 'Não foi possível confirmar o salvamento na nuvem. Tente novamente.');
    } finally {
      if (current()) { busy.current = false; setSyncing(false); }
    }
  }

  function persist(next: Obra[]) {
    latest.current = next;
    setObras(next);
    if (!storageKey) return;
    void cache(storageKey, next, baseline.current, true).then(() => {
      if (!conflictCount.current) void synchronize();
    }).catch(() => setSyncError('Não foi possível salvar neste dispositivo. Mantenha esta página aberta e tente novamente.'));
  }
  function retrySync() { void synchronize(); }
  function resolveSync(prefer: 'local' | 'remote') { void synchronize(prefer); }

  const adicionarObra = (novaObra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => {
    const obraCompleta: Obra = {
      ...novaObra,
      id: createId(),
      gasto: 0,
      tarefas: [],
      materiais: [],
      fotos: [],
    };
    void persist([...latest.current, obraCompleta]);
  };

  const adicionarTarefa = (obraId: string, tarefa: Omit<Tarefa, 'id'>) => {
    const novas = latest.current.map((obra) => {
      if (obra.id !== obraId) return obra;
      const tarefas = [...obra.tarefas, { ...tarefa, id: createId() }];
      const progresso = Math.round(tarefas.filter((item) => item.status === 'Concluído').length / tarefas.length * 100);
      return { ...obra, tarefas, progresso };
    });
    void persist(novas);
  };

  const adicionarMaterial = (obraId: string, material: Omit<Material, 'id'>) => {
    const novas = latest.current.map((obra) => {
      if (obra.id !== obraId) return obra;

      const materiais = [...obra.materiais, { ...material, id: createId() }];
      const gasto = obra.gasto + material.valor;

      return { ...obra, materiais, gasto };
    });
    void persist(novas);
  };

  const adicionarFoto = (obraId: string, fotoUri: string) => {
    void persist(
      latest.current.map((obra) =>
        obra.id === obraId ? { ...obra, fotos: [...obra.fotos, fotoUri] } : obra
      )
    );
  };

  const atualizarStatusTarefa = (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => {
    const novas = latest.current.map((obra) => {
      if (obra.id !== obraId) return obra;

      const tarefas = obra.tarefas.map((t) =>
        t.id === tarefaId ? { ...t, status: novoStatus } : t
      );
      const concluidas = tarefas.filter((t) => t.status === 'Concluído').length;
      const progresso = tarefas.length > 0 ? Math.round((concluidas / tarefas.length) * 100) : obra.progresso;

      return { ...obra, tarefas, progresso };
    });

    void persist(novas);
  };

  const value = {
      obras,
      loading,
      syncing,
      lastSync,
      syncError,
      retrySync,
      syncConflicts,
      resolveSync,
      adicionarObra,
      adicionarTarefa,
      adicionarMaterial,
      adicionarFoto,
      atualizarStatusTarefa,
  };

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}

export function useObras() {
  const context = useContext(ObraContext);
  if (!context) throw new Error('useObras deve ser usado dentro de ObraProvider');
  return context;
}
