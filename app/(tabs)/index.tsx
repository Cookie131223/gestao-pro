// app/(tabs)/index.tsx
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useObras } from '../../context/ObraContext'; // Hook dinâmico

export default function DashboardScreen() {
  const router = useRouter();
  const { obras } = useObras(); // Puxa as obras direto do banco local

  // 🧮 CÁLCULOS AUTOMÁTICOS DE MÉTRICAS EM TEMPO REAL
  const obrasAtivas = obras.filter(o => o.status === 'Em Andamento').length;
  const obrasAtrasadas = obras.filter(o => o.status === 'Atrasada').length;
  
  const orcamentoTotal = obras.reduce((acc, o) => acc + o.orcamento, 0);
  const gastoTotal = obras.reduce((acc, o) => acc + o.gasto, 0);
  const percentualGastoGlobal = orcamentoTotal > 0 ? Math.round((gastoTotal / orcamentoTotal) * 100) : 0;

  // Formatar moeda BRL de forma simplificada
  const formatarMoeda = (valor: number) => {
    if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(0)}k`;
    return `R$ ${valor}`;
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* Cabeçalho Superior Fixo */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.btnNovaObra}
          onPress={() => router.push('/modal')}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <Text style={styles.btnText}>Nova Obra</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Rolável */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Cards Indicadores Superiores Dinâmicos */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.metricLabel}>Obras Ativas</Text>
            <View style={styles.metricValueContainer}>
              <Feather name="copy" size={18} color="#3B82F6" style={styles.metricIcon} />
              <Text style={[styles.metricValue, { color: '#1E293B' }]}>{obrasAtivas}</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#EF4444' }]}>
            <Text style={styles.metricLabel}>Obras Atrasadas</Text>
            <View style={styles.metricValueContainer}>
              <Feather name="alert-circle" size={18} color="#EF4444" style={styles.metricIcon} />
              <Text style={[styles.metricValue, { color: '#EF4444' }]}>{obrasAtrasadas}</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#22C55E' }]}>
            <Text style={styles.metricLabel}>Orçamento Total</Text>
            <View style={styles.metricValueContainer}>
              <Feather name="trending-up" size={18} color="#22C55E" style={styles.metricIcon} />
              <Text style={[styles.metricValue, { color: '#1E293B' }]}>{formatarMoeda(orcamentoTotal)}</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#F97316' }]}>
            <Text style={styles.metricLabel}>Gasto Acumulado</Text>
            <View style={styles.metricValueContainer}>
              <Feather name="clock" size={18} color="#F97316" style={styles.metricIcon} />
              <Text style={[styles.metricValue, { color: '#1E293B' }]}>{formatarMoeda(gastoTotal)}</Text>
            </View>
            <Text style={styles.metricSubtext}>{percentualGastoGlobal}% do orçamento</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Minhas Obras</Text>

        {/* Mapeamento Dinâmico das Obras Cadastradas */}
        {obras.map((obra) => (
          <TouchableOpacity 
            key={obra.id} 
            style={[styles.obraCard, { borderLeftColor: obra.borderColor }]}
            onPress={() => router.push({
              pathname: '/details',
              params: { id: obra.id, nome: obra.nome, fase: obra.fase }
            })}
          >
            {/* Header do Card */}
            <View style={styles.obraHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.obraNome}>{obra.nome}</Text>
                <View style={[styles.statusBadge, { backgroundColor: obra.statusColor }]}>
                  <Text style={styles.statusText}>{obra.status}</Text>
                </View>
              </View>
              <View style={styles.faseContainer}>
                <Text style={styles.faseLabel}>Fase Atual</Text>
                <Text style={styles.faseValue}>{obra.fase}</Text>
              </View>
            </View>

            <Text style={styles.infoText}>Cliente: {obra.cliente}</Text>
            <Text style={styles.infoText}>{obra.endereco}</Text>

            {/* Progresso Dinâmico */}
            <View style={styles.progressoSection}>
              <View style={styles.progressoLabels}>
                <Text style={styles.progressoTitle}>Progresso</Text>
                <Text style={styles.progressoPercentage}>{obra.progresso}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${obra.progresso}%` }]} />
              </View>
            </View>

            {/* Grid de Valores */}
            <View style={styles.dadosGrid}>
              <View style={styles.dadoCol}>
                <Text style={styles.dadoLabel}>Início</Text>
                <Text style={styles.dadoValue}>{obra.inicio}</Text>
              </View>
              <View style={styles.dadoCol}>
                <Text style={styles.dadoLabel}>Previsão</Text>
                <Text style={styles.dadoValue}>{obra.previsao}</Text>
              </View>
              <View style={styles.dadoCol}>
                <Text style={styles.dadoLabel}>Orçamento</Text>
                <Text style={styles.dadoValue}>{formatarMoeda(obra.orcamento)}</Text>
              </View>
              <View style={styles.dadoCol}>
                <Text style={styles.dadoLabel}>Gasto</Text>
                <Text style={styles.dadoValue}>{formatarMoeda(obra.gasto)} ({obra.orcamento > 0 ? Math.round((obra.gasto / obra.orcamento) * 100) : 0}%)</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  btnNovaObra: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  scrollContainer: { flex: 1, paddingHorizontal: 24 },
  metricsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32, flexWrap: 'wrap' },
  metricCard: { flex: 1, minWidth: '22%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 6, justifyContent: 'center', minHeight: 120 },
  metricLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 12 },
  metricValueContainer: { flexDirection: 'row', alignItems: 'center' },
  metricIcon: { marginRight: 8 },
  metricValue: { fontSize: 24, fontWeight: 'bold' },
  metricSubtext: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  obraCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 6 },
  obraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' },
  obraNome: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  faseContainer: { alignItems: 'flex-end' },
  faseLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  faseValue: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  infoText: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  progressoSection: { marginTop: 16, marginBottom: 20 },
  progressoLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressoTitle: { fontSize: 12, color: '#64748B' },
  progressoPercentage: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0F172A' },
  dadosGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  dadoCol: { flex: 1 },
  dadoLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  dadoValue: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' }
});