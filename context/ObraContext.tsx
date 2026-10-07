import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  adicionarObra: (obra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => void;
  adicionarTarefa: (obraId: string, tarefa: Omit<Tarefa, 'id'>) => void;
  adicionarMaterial: (obraId: string, material: Omit<Material, 'id'>) => void;
  adicionarFoto: (obraId: string, fotoUri: string) => void;
  atualizarStatusTarefa: (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => void;
}

const ObraContext = createContext<ObraContextType | undefined>(undefined);

const dadosIniciais: Obra[] = [
  {
    id: '1',
    nome: 'Casa Residencial - Jardim das Flores',
    status: 'Em Andamento',
    statusColor: '#2563EB',
    cliente: 'João Silva',
    endereco: 'Rua das Flores, 123 - Jardim das Flores',
    fase: 'Estrutura',
    progresso: 45,
    inicio: '14/01/2026',
    previsao: '29/06/2026',
    orcamento: 280000,
    gasto: 126000,
    borderColor: '#2563EB',
    tarefas: [
      {
        id: 't1',
        titulo: 'Concretagem da laje do 1º pavimento',
        descricao: 'Preparar e executar a concretagem da laje',
        categoria: 'Estrutura',
        responsavel: 'Equipe A - José Silva',
        prioridade: 'Alta',
        status: 'Em Andamento',
        inicio: '24/04/2026',
        prazo: '27/04/2026',
      },
    ],
    materiais: [],
    fotos: [],
  },
  {
    id: '2',
    nome: 'Reforma Comercial - Loja Center',
    status: 'Atrasada',
    statusColor: '#EF4444',
    cliente: 'Maria Santos',
    endereco: 'Av. Principal, 456 - Centro',
    fase: 'Acabamento',
    progresso: 30,
    inicio: '31/01/2026',
    previsao: '14/04/2026',
    orcamento: 95000,
    gasto: 42000,
    borderColor: '#EF4444',
    tarefas: [
      {
        id: 't2',
        titulo: 'Instalação elétrica térreo',
        descricao: 'Passar tubulação e caixas elétricas no pavimento térreo',
        categoria: 'Instalações',
        responsavel: 'Eletricista - Carlos',
        prioridade: 'Média',
        status: 'Pendente',
        inicio: '28/04/2026',
        prazo: '05/05/2026',
      },
    ],
    materiais: [],
    fotos: [],
  },
];

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const storageKey = session?.user.id ? `@obramax:obras:${session.user.id}` : null;

  useEffect(() => {
    let active = true;

    (async () => {
      if (!session || !storageKey) {
        setObras([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const remote = await getGestaoData(session.access_token, session.user.id);

        if (!active) return;

        if (remote?.obras && Array.isArray(remote.obras)) {
          setObras(remote.obras as Obra[]);
          await AsyncStorage.setItem(storageKey, JSON.stringify(remote.obras));
          setLastSync(remote.updated_at ? new Date(remote.updated_at) : new Date());
          return;
        }

        const local = await AsyncStorage.getItem(storageKey);
        const initial = local ? (JSON.parse(local) as Obra[]) : dadosIniciais;
        setObras(initial);
        await AsyncStorage.setItem(storageKey, JSON.stringify(initial));
        await saveGestaoData(session.access_token, session.user.id, initial);
        setLastSync(new Date());
      } catch {
        const local = await AsyncStorage.getItem(storageKey);
        if (active) setObras(local ? JSON.parse(local) : dadosIniciais);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [session?.user.id, session?.access_token, storageKey]);

  async function persist(next: Obra[]) {
    setObras(next);

    if (!session || !storageKey) return;

    try {
      setSyncing(true);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      await saveGestaoData(session.access_token, session.user.id, next);
      setLastSync(new Date());
    } catch (error) {
      console.error('Erro ao sincronizar dados', error);
    } finally {
      setSyncing(false);
    }
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
    void persist([...obras, obraCompleta]);
  };

  const adicionarTarefa = (obraId: string, tarefa: Omit<Tarefa, 'id'>) => {
    const novas = obras.map((obra) =>
      obra.id === obraId
        ? { ...obra, tarefas: [...obra.tarefas, { ...tarefa, id: Date.now().toString() }] }
        : obra
    );
    void persist(novas);
  };

  const adicionarMaterial = (obraId: string, material: Omit<Material, 'id'>) => {
    const novas = obras.map((obra) => {
      if (obra.id !== obraId) return obra;

      const materiais = [...obra.materiais, { ...material, id: Date.now().toString() }];
      const gasto = materiais.reduce((acc, item) => acc + item.valor, 0);

      return { ...obra, materiais, gasto };
    });
    void persist(novas);
  };

  const adicionarFoto = (obraId: string, fotoUri: string) => {
    void persist(
      obras.map((obra) =>
        obra.id === obraId ? { ...obra, fotos: [...obra.fotos, fotoUri] } : obra
      )
    );
  };

  const atualizarStatusTarefa = (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => {
    const novas = obras.map((obra) => {
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

  const value = useMemo(
    () => ({
      obras,
      loading,
      syncing,
      lastSync,
      adicionarObra,
      adicionarTarefa,
      adicionarMaterial,
      adicionarFoto,
      atualizarStatusTarefa,
    }),
    [obras, loading, syncing, lastSync]
  );

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}

export function useObras() {
  const context = useContext(ObraContext);
  if (!context) throw new Error('useObras deve ser usado dentro de ObraProvider');
  return context;
}
