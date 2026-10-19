import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { getGestaoData, saveGestaoData } from '../lib/supabase-api';

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
  adicionarObra: (obra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => void;
  adicionarTarefa: (obraId: string, tarefa: Omit<Tarefa, 'id'>) => void;
  adicionarMaterial: (obraId: string, material: Omit<Material, 'id'>) => void;
  adicionarFoto: (obraId: string, fotoUri: string) => void;
  atualizarStatusTarefa: (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => void;
}

const ObraContext = createContext<ObraContextType | undefined>(undefined);

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [syncError, setSyncError] = useState<string | null>(null);
  const localQueue = useRef<Promise<void>>(Promise.resolve());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef<Obra[]>([]);
  const owner = useRef(session?.user.id);
  owner.current = session?.user.id;

  const storageKey = session?.user.id ? `@obramax:obras:${session.user.id}` : null;

  useEffect(() => {
    let active = true;

    (async () => {
      if (!session || !storageKey) {
        latest.current = [];
        setObras([]);
        setSyncError(null);
        setLastSync(null);
        setSyncing(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLastSync(null);
      setSyncError(null);

      try {
        const pending = await AsyncStorage.getItem(`${storageKey}:pending`);
        if (pending) {
          const recovered = JSON.parse(pending) as Obra[];
          if (!active) return;
          latest.current = recovered;
          setObras(recovered);
          setSyncError('Há alterações locais pendentes. Tente sincronizar novamente.');
          return;
        }
        const remote = await getGestaoData(session.access_token, session.user.id);

        if (!active) return;

        if (remote?.obras && Array.isArray(remote.obras)) {
          latest.current = remote.obras as Obra[];
          setObras(remote.obras as Obra[]);
          await AsyncStorage.setItem(storageKey, JSON.stringify(remote.obras));
          setLastSync(remote.updated_at ? new Date(remote.updated_at) : new Date());
          return;
        }

        const local = await AsyncStorage.getItem(storageKey);
        const initial = local ? (JSON.parse(local) as Obra[]) : [];
        latest.current = initial;
        setObras(initial);
        await AsyncStorage.setItem(storageKey, JSON.stringify(initial));
        await saveGestaoData(session.access_token, session.user.id, initial);
        setLastSync(new Date());
      } catch {
        const local = await AsyncStorage.getItem(storageKey);
        if (active) {
          latest.current = local ? JSON.parse(local) : [];
          setObras(latest.current);
          setSyncError('Não foi possível carregar os dados da nuvem. Verifique a conexão.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [session?.user.id, session?.access_token, storageKey]);

  function persist(next: Obra[]) {
    latest.current = next;
    setObras(next);
    if (!session || !storageKey) return;
    const userId = session.user.id;
    const token = session.access_token;
    setSyncing(true);
    setSyncError(null);
    const localWrite = localQueue.current.catch(() => {}).then(async () => {
      await AsyncStorage.setItem(`${storageKey}:pending`, JSON.stringify(next));
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    });
    localQueue.current = localWrite;
    // Attach a handler immediately; the remote queue still observes the rejection.
    void localWrite.catch(() => {});
    queue.current = queue.current.catch(() => {}).then(async () => {
      try {
        await localWrite;
        if (owner.current !== userId) return;
        await saveGestaoData(token, userId, next);
        if (owner.current === userId && latest.current === next) {
          await AsyncStorage.removeItem(`${storageKey}:pending`);
          setLastSync(new Date());
          setSyncError(null);
        }
      } catch {
        if (owner.current === userId) {
          setSyncError('Não foi possível confirmar o salvamento na nuvem. Tente novamente.');
        }
      } finally {
        if (owner.current === userId && latest.current === next) setSyncing(false);
      }
    });
  }

  function retrySync() {
    if (!syncing) persist(latest.current);
  }

  const adicionarObra = (novaObra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => {
    const obraCompleta: Obra = {
      ...novaObra,
      id: Date.now().toString(),
      gasto: 0,
      tarefas: [],
      materiais: [],
      fotos: [],
    };
    void persist([...latest.current, obraCompleta]);
  };

  const adicionarTarefa = (obraId: string, tarefa: Omit<Tarefa, 'id'>) => {
    const novas = latest.current.map((obra) =>
      obra.id === obraId
        ? { ...obra, tarefas: [...obra.tarefas, { ...tarefa, id: Date.now().toString() }] }
        : obra
    );
    void persist(novas);
  };

  const adicionarMaterial = (obraId: string, material: Omit<Material, 'id'>) => {
    const novas = latest.current.map((obra) => {
      if (obra.id !== obraId) return obra;

      const materiais = [...obra.materiais, { ...material, id: Date.now().toString() }];
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
