// app/(tabs)/details.tsx
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useObras } from '../../context/ObraContext';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { obras, adicionarTarefa, adicionarMaterial, atualizarStatusTarefa } = useObras();

  // Encontra a obra ativa com base no ID passado por parâmetro no clique do Dashboard
  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find(o => o.id === obraId);

  // Controle de Abas Internas: 'geral' | 'cronograma' | 'materiais'
  const [activeTab, setActiveTab] = useState<'geral' | 'cronograma' | 'materiais'>('geral');

  // Estados para formulário de Nova Tarefa
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [respTarefa, setRespTarefa] = useState('');
  const [prioTarefa, setPrioTarefa] = useState<'Alta' | 'Média' | 'Baixa'>('Média');

  // Estados para formulário de Novo Material
  const [nomeMat, setNomeMat] = useState('');
  const [qtdMat, setQtdMat] = useState('');
  const [valorMat, setValorMat] = useState('');

  if (!obra) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Obra não encontrada ou removida.</Text>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnVoltarText}>Voltar ao Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Funções de Submissão
  const handleCriarTarefa = () => {
    if (!tituloTarefa) return alert('Insira o título da tarefa!');
    adicionarTarefa(obra.id, {
      titulo: tituloTarefa,
      descricao: 'Criada via painel de controle',
      categoria: 'Geral',
      responsavel: respTarefa || 'Equipe Local',
      prioridade: prioTarefa,
      status: 'Pendente',
      inicio: new Date().toLocaleDateString('pt-BR'),
      prazo: 'A definir'
    });
    setTituloTarefa('');
    setRespTarefa('');
    alert('Tarefa adicionada ao cronograma!');
  };

  const handleLancarMaterial = () => {
    if (!nomeMat || !valorMat) return alert('Preencha o nome e o valor do material!');
    adicionarMaterial(obra.id, {
      nome: nomeMat,
      quantidade: qtdMat || '1 un',
      valor: parseFloat(valorMat)
    });
    setNomeMat('');
    setQtdMat('');
    setValorMat('');
    alert('Gasto com material lançado com sucesso!');
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* Header de Navegação */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backLink}>
          <Feather name="arrow-left" size={20} color="#3B82F6" />
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{obra.nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: obra.statusColor }]}>
          <Text style={styles.badgeText}>{obra.status}</Text>
        </View>
      </View>

      {/* Menu de Abas Estilo Figma */}
      <View style={styles.tabsMenuRow}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'geral' && styles.tabActive]} onPress={() => setActiveTab('geral')}>
          <Feather name="info" size={16} color={activeTab === 'geral' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'geral' && styles.tabTextActive]}>Geral</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'cronograma' && styles.tabActive]} onPress={() => setActiveTab('cronograma')}>
          <Feather name="calendar" size={16} color={activeTab === 'cronograma' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'cronograma' && styles.tabTextActive]}>Cronograma ({obra.tarefas.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'materiais' && styles.tabActive]} onPress={() => setActiveTab('materiais')}>
          <Feather name="package" size={16} color={activeTab === 'materiais' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'materiais' && styles.tabTextActive]}>Materiais/Custos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* ABA 1: VISÃO GERAL */}
        {activeTab === 'geral' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Dados Básicos</Text>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoVal}>{obra.cliente}</Text>
              <Text style={styles.infoLabel}>Endereço Comercial</Text>
              <Text style={styles.infoVal}>{obra.endereco}</Text>
              <Text style={styles.infoLabel}>Fase Construtiva Atual</Text>
              <Text style={styles.infoVal}>{obra.fase}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Saúde Financeira da Obra</Text>
              <View style={styles.financialRow}>
                <View>
                  <Text style={styles.infoLabel}>Orçamento Total</Text>
                  <Text style={[styles.infoVal, { fontSize: 18, color: '#10B981' }]}>R$ {obra.orcamento.toLocaleString('pt-BR')}</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Total Lançado (Materiais)</Text>
                  <Text style={[styles.infoVal, { fontSize: 18, color: '#EF4444' }]}>R$ {obra.gasto.toLocaleString('pt-BR')}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ABA 2: CRONOGRAMA DA OBRA */}
        {activeTab === 'cronograma' && (
          <View style={styles.tabContent}>
            {/* Formulário Rápido para Criar Tarefa */}
            <View style={styles.quickForm}>
              <Text style={styles.formTitle}>+ Nova Tarefa para o Cronograma</Text>
              <TextInput style={styles.input} placeholder="Nome da Tarefa (Ex: Pintura externa)" placeholderTextColor="#94A3B8" value={tituloTarefa} onChangeText={setTituloTarefa} />
              <TextInput style={styles.input} placeholder="Responsável (Ex: Mestre Carlos)" placeholderTextColor="#94A3B8" value={respTarefa} onChangeText={setRespTarefa} />
              <TouchableOpacity style={styles.btnSubmit} onPress={handleCriarTarefa}>
                <Text style={styles.btnSubmitText}>Adicionar Tarefa</Text>
              </TouchableOpacity>
            </View>

            {/* Listagem das tarefas vinculadas a essa obra */}
            <Text style={styles.sectionSubtitle}>Lista de Tarefas Locais</Text>
            {obra.tarefas.map(t => (
              <View key={t.id} style={styles.localTaskCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.localTaskTitle}>{t.titulo}</Text>
                  <Text style={styles.localTaskSub}>Responsável: {t.responsavel}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.statusToggleBadge, { backgroundColor: t.status === 'Concluído' ? '#10B981' : '#64748B' }]}
                  onPress={() => atualizarStatusTarefa(obra.id, t.id, t.status === 'Concluído' ? 'Em Andamento' : 'Concluído')}
                >
                  <Text style={styles.toggleText}>{t.status} 🔄</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ABA 3: MATERIAIS / LANÇAR GASTOS */}
        {activeTab === 'materiais' && (
          <View style={styles.tabContent}>
            {/* Formulário Rápido para Lançar Material */}
            <View style={styles.quickForm}>
              <Text style={styles.formTitle}>💵 Lançar Compra de Material / Insumo</Text>
              <TextInput style={styles.input} placeholder="Nome do Material (Ex: Cimento Cauê)" placeholderTextColor="#94A3B8" value={nomeMat} onChangeText={setNomeMat} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Qtd (Ex: 50 sacos)" placeholderTextColor="#94A3B8" value={qtdMat} onChangeText={setQtdMat} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Custo Total R$ (Ex: 1500)" placeholderTextColor="#94A3B8" keyboardType="numeric" value={valorMat} onChangeText={setValorMat} />
              </View>
              <TouchableOpacity style={[styles.btnSubmit, { backgroundColor: '#10B981' }]} onPress={handleLancarMaterial}>
                <Text style={styles.btnSubmitText}>Lançar Custo de Insumo</Text>
              </TouchableOpacity>
            </View>

            {/* Histórico de Compras da Obra */}
            <Text style={styles.sectionSubtitle}>Histórico de Insumos Lançados</Text>
            {obra.materiais.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum material associado a esta obra.</Text>
            ) : (
              obra.materiais.map(m => (
                <View key={m.id} style={styles.materialRow}>
                  <View>
                    <Text style={styles.matName}>{m.nome}</Text>
                    <Text style={styles.matDetails}>Quantidade: {m.quantidade}</Text>
                  </View>
                  <Text style={styles.matPrice}>- R$ {m.valor.toLocaleString('pt-BR')}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', gap: 16 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLinkText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', flex: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  
  tabsMenuRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: '#3B82F6', fontWeight: '700' },
  
  scrollContainer: { flex: 1, padding: 24 },
  tabContent: { paddingBottom: 40 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 11, color: '#94A3B8', marginTop: 10, marginBottom: 2, textTransform: 'uppercase' },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  
  quickForm: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  formTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 14 },
  input: { height: 40, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, fontSize: 13, color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: 12 },
  btnSubmit: { backgroundColor: '#3B82F6', height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  btnSubmitText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  
  sectionSubtitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 14 },
  localTaskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  localTaskTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  localTaskSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusToggleBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  toggleText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  
  materialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  matName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  matDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  matPrice: { fontSize: 14, fontWeight: 'bold', color: '#EF4444' },
  emptyText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 20 },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 },
  errorText: { fontSize: 16, color: '#64748B', fontWeight: '500', marginBottom: 16 },
  btnVoltar: { backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnVoltarText: { color: '#FFF', fontWeight: '600' }
});