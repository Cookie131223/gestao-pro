// context/ObraContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Interfaces de Tipo para Typescript
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
  orcamento: number; // Armazenado como número puro para fazermos cálculos
  gasto: number;     // Somatório dinâmico dos materiais
  borderColor: string;
  tarefas: Tarefa[];
  materiais: Material[];
  fotos: string[];
}

interface ObraContextType {
  obras: Obra[];
  adicionarObra: (obra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => void;
  adicionarTarefa: (obraId: string, tarefa: Omit<Tarefa, 'id'>) => void;
  adicionarMaterial: (obraId: string, material: Omit<Material, 'id'>) => void;
  adicionarFoto: (obraId: string, fotoUri: string) => void;
  atualizarStatusTarefa: (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => void;
}

const ObraContext = createContext<ObraContextType | undefined>(undefined);

// Dados Iniciais Base (Caso o armazenamento esteja vazio)
const dadosIniciais: Obra[] = [
  {
    id: '1',
    nome: 'Casa Residential - Jardim das Flores',
    status: 'Em Andamento',
    statusColor: '#3B82F6',
    cliente: 'João Silva',
    endereco: 'Rua das Flores, 123 - Jardim das Flores',
    fase: 'Estrutura',
    progresso: 45,
    inicio: '14/01/2026',
    previsao: '29/06/2026',
    orcamento: 280000,
    gasto: 126000,
    borderColor: '#3B82F6',
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
      }
    ],
    materiais: [],
    fotos: []
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
      }
    ],
    materiais: [],
    fotos: []
  }
];

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const [obras, setObras] = useState<Obra[]>([]);

  // Carregar dados salvos ao iniciar o app
  useEffect(() => {
    async function carregarDados() {
      try {
        const dadosSalvos = await AsyncStorage.getItem('@obramax:obras');
        if (dadosSalvos) {
          setObras(JSON.parse(dadosSalvos));
        } else {
          setObras(dadosIniciais);
          await AsyncStorage.setItem('@obramax:obras', JSON.stringify(dadosIniciais));
        }
      } catch (error) {
        console.error('Erro ao carregar do AsyncStorage', error);
        setObras(dadosIniciais);
      }
    }
    carregarDados();
  }, []);

  // Salvar automaticamente no AsyncStorage sempre que a lista mudar
  const salvarDados = async (novasObras: Obra[]) => {
    try {
      setObras(novasObras);
      await AsyncStorage.setItem('@obramax:obras', JSON.stringify(novasObras));
    } catch (error) {
      console.error('Erro ao salvar no AsyncStorage', error);
    }
  };

  // Função 1: Criar Nova Obra
  const adicionarObra = (novaObra: Omit<Obra, 'id' | 'gasto' | 'tarefas' | 'materiais' | 'fotos'>) => {
    const obraCompleta: Obra = {
      ...novaObra,
      id: Date.now().toString(),
      gasto: 0,
      tarefas: [],
      materiais: [],
      fotos: []
    };
    salvarDados([...obras, obraCompleta]);
  };

  // Função 2: Adicionar Tarefa ao Cronograma de uma Obra
  const adicionarTarefa = (obraId: string, tarefa: Omit<Tarefa, 'id'>) => {
    const novasObras = obras.map(obra => {
      if (obra.id === obraId) {
        const novaT = { ...tarefa, id: Date.now().toString() };
        return { ...obra, tarefas: [...obra.tarefas, novaT] };
      }
      return obra;
    });
    salvarDados(novasObras);
  };

  // Função 3: Adicionar Insumo/Material (Atualiza os gastos automaticamente)
  const adicionarMaterial = (obraId: string, material: Omit<Material, 'id'>) => {
    const novasObras = obras.map(obra => {
      if (obra.id === obraId) {
        const novoM = { ...material, id: Date.now().toString() };
        const listaMateriais = [...obra.materiais, novoM];
        const novoGasto = listaMateriais.reduce((acc, item) => acc + item.valor, 0);
        return { ...obra, materiais: listaMateriais, gasto: novoGasto };
      }
      return obra;
    });
    salvarDados(novasObras);
  };

  // Função 4: Adicionar URL/Uri de Foto tirada ou carregada
  const adicionarFoto = (obraId: string, fotoUri: string) => {
    const novasObras = obras.map(obra => {
      if (obra.id === obraId) {
        return { ...obra, fotos: [...obra.fotos, fotoUri] };
      }
      return obra;
    });
    salvarDados(novasObras);
  };

  // Função 5: Alternar/Atualizar Status das tarefas e recalcular progresso da obra
  const atualizarStatusTarefa = (obraId: string, tarefaId: string, novoStatus: Tarefa['status']) => {
    const novasObras = obras.map(obra => {
      if (obra.id === obraId) {
        const tarefasAtualizadas = obra.tarefas.map(t => t.id === tarefaId ? { ...t, status: novoStatus } : t);
        
        // Regra de Negócio: Calcular progresso baseado na quantidade de tarefas concluídas
        const concluidas = tarefasAtualizadas.filter(t => t.status === 'Concluído').length;
        const total = tarefasAtualizadas.length;
        const novoProgresso = total > 0 ? Math.round((concluidas / total) * 100) : obra.progresso;

        return { ...obra, tarefas: tarefasAtualizadas, progresso: novoProgresso };
      }
      return obra;
    });
    salvarDados(novasObras);
  };

  return (
    <ObraContext.Provider value={{ obras, adicionarObra, adicionarTarefa, adicionarMaterial, adicionarFoto, atualizarStatusTarefa }}>
      {children}
    </ObraContext.Provider>
  );
}

export function useObras() {
  const context = useContext(ObraContext);
  if (!context) throw new Error('useObras deve ser usado dentro de um ObraProvider');
  return context;
}