// app/(tabs)/details.tsx
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useObras } from '../../context/ObraContext';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { obras } = useObras();

  // Garante a captura correta do ID vindo do clique no Dashboard
  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find(o => o.id === obraId);

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

  // 🧮 CÁLCULOS FINANCEIROS DINÂMICOS
  const saldoDisponivel = obra.orcamento - obra.gasto;
  const percentualFinanceiro = obra.orcamento > 0 ? (obra.gasto / obra.orcamento) * 100 : 0;

  // Formatação amigável de Moeda BRL
  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* 🟢 TOP HEADER FIEL AO FIGMA */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.blueIconBox}>
            <Feather name="layers" size={20} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>{obra.nome}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: obra.statusColor }]}>
          <Text style={styles.badgeText}>{obra.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 🟢 FILEIRA DE 4 CARDS INDICADORES */}
        <View style={styles.indicatorsGrid}>
          
          {/* Card 1: Cliente */}
          <View style={[styles.indicatorCard, { borderLeftColor: '#A855F7' }]}>
            <View style={styles.cardHeaderRow}>
              <Feather name="user" size={16} color="#94A3B8" />
              <Text style={styles.cardLabel}>Cliente</Text>
            </View>
            <Text style={styles.cardMainValue} numberOfLines={1}>{obra.cliente}</Text>
          </View>

          {/* Card 2: Localização */}
          <View style={[styles.indicatorCard, { borderLeftColor: '#3B82F6' }]}>
            <View style={styles.cardHeaderRow}>
              <Feather name="map-pin" size={16} color="#94A3B8" />
              <Text style={styles.cardLabel}>Localização</Text>
            </View>
            <Text style={styles.cardSubValue} numberOfLines={2}>{obra.endereco}</Text>
          </View>

          {/* Card 3: Prazo */}
          <View style={[styles.indicatorCard, { borderLeftColor: '#F97316' }]}>
            <View style={styles.cardHeaderRow}>
              <Feather name="calendar" size={16} color="#94A3B8" />
              <Text style={styles.cardLabel}>Prazo</Text>
            </View>
            <Text style={styles.cardMainValue}>31 dias restantes</Text>
            <Text style={styles.cardSubtext}>134 dias decorridos</Text>
          </View>

          {/* Card 4: Progresso */}
          <View style={[styles.indicatorCard, { borderLeftColor: '#22C55E' }]}>
            <View style={styles.cardHeaderRow}>
              <Feather name="trending-up" size={16} color="#94A3B8" />
              <Text style={styles.cardLabel}>Progresso</Text>
            </View>
            <Text style={[styles.cardMainValue, { fontSize: 32, marginTop: 4 }]}>{obra.progresso}%</Text>
          </View>

        </View>

        {/* 🟢 SEÇÃO DE DOIS BLOCOS (LADO A LADO) */}
        <View style={styles.contentSplitRow}>
          
          {/* BLOCO DA ESQUERDA: VISÃO FINANCEIRA */}
          <View style={styles.leftPanel}>
            <View style={styles.panelHeader}>
              <Feather name="dollar-sign" size={18} color="#22C55E" />
              <Text style={styles.panelTitle}>Visão Financeira</Text>
            </View>

            <View style={styles.financialDataContainer}>
              <View style={styles.financialRow}>
                <Text style={styles.finLabel}>Orçamento Total</Text>
                <Text style={styles.finValueDark}>{formatarMoeda(obra.orcamento)}</Text>
              </View>
              
              <View style={styles.financialRow}>
                <Text style={styles.finLabel}>Valor Gasto</Text>
                <Text style={[styles.finValueDark, { color: '#3B82F6' }]}>{formatarMoeda(obra.gasto)}</Text>
              </View>

              <View style={styles.financialRow}>
                <Text style={styles.finLabel}>Saldo Disponível</Text>
                <Text style={[styles.finValueDark, { color: '#22C55E' }]}>{formatarMoeda(saldoDisponivel)}</Text>
              </View>
            </View>

            {/* Barra de Progresso Financeiro */}
            <View style={styles.progressWrapper}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(percentualFinanceiro, 100)}%` }]} />
              </View>
              <Text style={styles.progressPercentageText}>{percentualFinanceiro.toFixed(1)}% do orçamento utilizado</Text>
            </View>

            {/* 🔥 BOTÕES DE AÇÃO INTEGRADOS */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.btnPrimaryAction} onPress={() => router.push('/explore')}>
                <Feather name="clipboard" size={16} color="#FFF" />
                <Text style={styles.btnPrimaryText}>Ver Cronograma</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSecondaryAction} onPress={() => alert('Abrindo gerenciamento avançado de materiais...')}>
                <Feather name="package" size={16} color="#1E293B" />
                <Text style={styles.btnSecondaryText}>Gerenciar Materiais</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSecondaryAction} onPress={() => alert('Abrindo galeria de fotos da obra...')}>
                <Feather name="camera" size={16} color="#1E293B" />
                <Text style={styles.btnSecondaryText}>Ver Fotos da Obra</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BLOCO DA DIREITA: CRONOGRAMA DA OBRA (LINHA DO TEMPO) */}
          <View style={styles.rightPanel}>
            <View style={styles.panelHeader}>
              <Feather name="calendar" size={18} color="#3B82F6" />
              <Text style={styles.panelTitle}>Cronograma da Obra</Text>
            </View>

            {/* Lista Vertical de Etapas Fiel à imagem_0d1823.png */}
            <View style={styles.timelineContainer}>
              
              {/* Etapa 1: Fundação */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineNode, { backgroundColor: '#10B981' }]}>
                  <Feather name="check" size={12} color="#FFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStageTitle}>Fundação</Text>
                  <Text style={styles.timelineStageDate}>Jan 2026</Text>
                </View>
                <View style={[styles.miniStatusBadge, { backgroundColor: '#E6F4EA' }]}>
                  <Text style={[styles.miniStatusText, { color: '#137333' }]}>Concluída</Text>
                </View>
              </View>

              {/* Etapa 2: Estrutura */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineNode, { backgroundColor: '#3B82F6' }]}>
                  <View style={styles.innerDotActive} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStageTitle}>Estrutura</Text>
                  <Text style={styles.timelineStageDate}>Mar 2026</Text>
                </View>
                <View style={[styles.miniStatusBadge, { backgroundColor: '#E8F0FE' }]}>
                  <Text style={[styles.miniStatusText, { color: '#1A73E8' }]}>Em Andamento</Text>
                </View>
              </View>

              {/* Etapa 3: Alvenaria */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineNode, { backgroundColor: '#CBD5E1' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStageTitle}>Alvenaria</Text>
                  <Text style={styles.timelineStageDate}>Abr 2026</Text>
                </View>
                <View style={[styles.miniStatusBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.miniStatusText, { color: '#64748B' }]}>Pendente</Text>
                </View>
              </View>

              {/* Etapa 4: Instalações */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineNode, { backgroundColor: '#CBD5E1' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStageTitle}>Instalações</Text>
                  <Text style={styles.timelineStageDate}>Mai 2026</Text>
                </View>
                <View style={[styles.miniStatusBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.miniStatusText, { color: '#64748B' }]}>Pendente</Text>
                </View>
              </View>

              {/* Etapa 5: Acabamento */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineNode, { backgroundColor: '#CBD5E1' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStageTitle}>Acabamento</Text>
                  <Text style={styles.timelineStageDate}>Jun 2026</Text>
                </View>
                <View style={[styles.miniStatusBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.miniStatusText, { color: '#64748B' }]}>Pendente</Text>
                </View>
              </View>

            </View>
          </View>

        </View>

        {/* Detalhes de Rodapé Inferior */}
        <View style={styles.footerDetailsSection}>
          <Text style={styles.footerSectionTitle}>Detalhes do Progresso</Text>
          <Text style={styles.footerSectionSub}>Fase Atual: {obra.fase} • O progresso geral é calculado com base nas tarefas finalizadas.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header Estilizado
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { padding: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  blueIconBox: { width: 36, height: 36, backgroundColor: '#3B82F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  
  scrollContainer: { flex: 1, padding: 24 },
  
  // Grid das 4 métricas superiores
  indicatorsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  indicatorCard: { flex: 1, minWidth: '22%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 5, minHeight: 96, justifyContent: 'center' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  cardMainValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  cardSubValue: { fontSize: 13, color: '#475569', fontWeight: '500', lineHeight: 18 },
  cardSubtext: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  
  // Divisão em dois painéis horizontais
  contentSplitRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', marginBottom: 24 },
  leftPanel: { flex: 1.2, minWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  rightPanel: { flex: 1, minWidth: 300, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
  panelTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  
  // Painel Esquerdo: Conteúdo Financeiro
  financialDataContainer: { gap: 14, marginBottom: 16 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finLabel: { fontSize: 14, color: '#64748B' },
  finValueDark: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  
  progressWrapper: { marginBottom: 24 },
  progressBarBg: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#000000' },
  progressPercentageText: { fontSize: 11, color: '#94A3B8' },
  
  // Botões de Ação do Painel Esquerdo
  actionButtonsContainer: { gap: 10 },
  btnPrimaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F54EB', height: 40, borderRadius: 8, gap: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  btnSecondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', height: 40, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#D9D9D9' },
  btnSecondaryText: { color: '#1E293B', fontSize: 13, fontWeight: '500' },
  
  // Painel Direito: Linha do tempo do Cronograma
  timelineContainer: { gap: 16 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  timelineNode: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  innerDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  timelineContent: { flex: 1 },
  timelineStageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  timelineStageDate: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  miniStatusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  miniStatusText: { fontSize: 11, fontWeight: '600' },
  
  // Seção de Rodapé
  footerDetailsSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 40 },
  footerSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 },
  footerSectionSub: { fontSize: 13, color: '#64748B' },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  errorText: { fontSize: 15, color: '#64748B', marginBottom: 16 },
  btnVoltar: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnVoltarText: { color: '#FFF', fontWeight: '600', fontSize: 13 }
});