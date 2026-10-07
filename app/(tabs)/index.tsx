import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useObras } from '../../context/ObraContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { obras, loading, syncing, lastSync } = useObras();
  const [search, setSearch] = useState('');

  const compact = width < 720;
  const medium = width < 1180;

  const obrasAtivas = obras.filter((o) => o.status === 'Em Andamento').length;
  const obrasAtrasadas = obras.filter((o) => o.status === 'Atrasada').length;
  const orcamentoTotal = obras.reduce((acc, o) => acc + o.orcamento, 0);
  const gastoTotal = obras.reduce((acc, o) => acc + o.gasto, 0);
  const percentualGastoGlobal =
    orcamentoTotal > 0 ? Math.round((gastoTotal / orcamentoTotal) * 100) : 0;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return obras;
    return obras.filter((obra) =>
      [obra.nome, obra.cliente, obra.endereco, obra.fase]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [obras, search]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  const firstName = session?.user.email?.split('@')[0] || 'gestor';

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>VISÃO GERAL</Text>
            <Text style={styles.headerTitle}>Olá, {firstName}</Text>
            <Text style={styles.headerSub}>
              Acompanhe obras, custos e cronograma em um único painel.
            </Text>
          </View>

          <TouchableOpacity style={styles.btnNovaObra} onPress={() => router.push('/modal')}>
            <Feather name="plus" size={17} color="#FFFFFF" />
            <Text style={styles.btnText}>Nova Obra</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.syncRow}>
          <View style={[styles.syncBadge, syncing && styles.syncBadgeBusy]}>
            {syncing ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Feather name="cloud" size={14} color="#2563EB" />
            )}
            <Text style={styles.syncText}>
              {syncing
                ? 'Sincronizando...'
                : lastSync
                  ? `Sincronizado às ${lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Nuvem conectada'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {[
            { label: 'Obras ativas', value: String(obrasAtivas), icon: 'briefcase', accent: '#2563EB' },
            { label: 'Atrasadas', value: String(obrasAtrasadas), icon: 'alert-circle', accent: '#EF4444' },
            { label: 'Orçamento', value: formatarMoeda(orcamentoTotal), icon: 'pie-chart', accent: '#7C3AED' },
            {
              label: 'Gasto acumulado',
              value: formatarMoeda(gastoTotal),
              icon: 'trending-up',
              accent: '#EA580C',
              sub: `${percentualGastoGlobal}% do orçamento`,
            },
          ].map((item) => (
            <View
              key={item.label}
              style={[
                styles.metricCard,
                { borderTopColor: item.accent },
                medium && styles.metricCardMedium,
                compact && styles.metricCardCompact,
              ]}
            >
              <View style={[styles.metricIconBox, { backgroundColor: item.accent + '16' }]}>
                <Feather name={item.icon as any} size={18} color={item.accent} />
              </View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue} numberOfLines={1}>{item.value}</Text>
              {!!item.sub && <Text style={styles.metricSubtext}>{item.sub}</Text>}
            </View>
          ))}
        </View>

        <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
          <View>
            <Text style={styles.sectionTitle}>Minhas obras</Text>
            <Text style={styles.sectionSub}>{obras.length} projeto(s) cadastrado(s)</Text>
          </View>

          <View style={[styles.searchBox, compact && styles.searchBoxCompact]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar obra, cliente ou fase..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.emptyTitle}>Carregando suas obras...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="folder" size={24} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'Nenhuma obra encontrada' : 'Comece sua primeira obra'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Tente buscar por outro nome, cliente ou etapa.'
                : 'Cadastre um projeto para acompanhar orçamento, tarefas e progresso.'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/modal')}>
                <Text style={styles.emptyButtonText}>Cadastrar obra</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filtered.map((obra) => (
              <TouchableOpacity
                key={obra.id}
                activeOpacity={0.82}
                style={styles.obraCard}
                onPress={() =>
                  router.push({
                    pathname: '/details',
                    params: { id: obra.id, nome: obra.nome, fase: obra.fase },
                  })
                }
              >
                <View style={[styles.obraAccent, { backgroundColor: obra.borderColor }]} />

                <View style={styles.obraBody}>
                  <View style={[styles.obraHeader, compact && styles.obraHeaderCompact]}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.obraNome}>{obra.nome}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: obra.statusColor + '18' }]}>
                          <View style={[styles.statusDot, { backgroundColor: obra.statusColor }]} />
                          <Text style={[styles.statusText, { color: obra.statusColor }]}>{obra.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.infoText}>{obra.cliente} · {obra.endereco}</Text>
                    </View>

                    <View style={[styles.fasePill, compact && { alignSelf: 'flex-start' }]}>
                      <Text style={styles.faseLabel}>Fase</Text>
                      <Text style={styles.faseValue}>{obra.fase}</Text>
                    </View>
                  </View>

                  <View style={styles.progressoSection}>
                    <View style={styles.progressoLabels}>
                      <Text style={styles.progressoTitle}>Progresso geral</Text>
                      <Text style={styles.progressoPercentage}>{obra.progresso}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(100, Math.max(0, obra.progresso))}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={[styles.dadosGrid, compact && styles.dadosGridCompact]}>
                    {[
                      ['Início', obra.inicio],
                      ['Previsão', obra.previsao],
                      ['Orçamento', formatarMoeda(obra.orcamento)],
                      ['Gasto', formatarMoeda(obra.gasto)],
                    ].map(([label, value]) => (
                      <View key={label} style={[styles.dadoCol, compact && styles.dadoColCompact]}>
                        <Text style={styles.dadoLabel}>{label}</Text>
                        <Text style={styles.dadoValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.cardArrow}>
                  <Feather name="chevron-right" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 32, paddingBottom: 60, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  contentCompact: { padding: 18, paddingBottom: 90 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  headerCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  eyebrow: { color: '#2563EB', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  headerTitle: { color: '#0F172A', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  headerSub: { color: '#64748B', fontSize: 14, marginTop: 6 },
  btnNovaObra: {
    height: 44,
    paddingHorizontal: 17,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  syncRow: { alignItems: 'flex-start', marginBottom: 24 },
  syncBadge: {
    minHeight: 31,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  syncBadgeBusy: { backgroundColor: '#F1F5F9' },
  syncText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 34 },
  metricCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 3,
    borderRadius: 16,
    padding: 18,
  },
  metricCardMedium: { minWidth: 260 },
  metricCardCompact: { minWidth: '100%' as any },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  metricLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  metricValue: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginTop: 5 },
  metricSubtext: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 18,
  },
  sectionHeaderCompact: { flexDirection: 'column', alignItems: 'stretch' },
  sectionTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  sectionSub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  searchBox: {
    width: 320,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBoxCompact: { width: '100%' },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 13, outlineStyle: 'none' } as any,
  cardsList: { gap: 14 },
  obraCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 17,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  obraAccent: { width: 5 },
  obraBody: { flex: 1, padding: 20, minWidth: 0 },
  obraHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  obraHeaderCompact: { flexDirection: 'column', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
  obraNome: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  infoText: { color: '#64748B', fontSize: 12, marginTop: 7 },
  fasePill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 100,
  },
  faseLabel: { color: '#94A3B8', fontSize: 9, textTransform: 'uppercase', fontWeight: '800' },
  faseValue: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 2 },
  progressoSection: { marginTop: 18 },
  progressoLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressoTitle: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  progressoPercentage: { color: '#0F172A', fontSize: 11, fontWeight: '800' },
  progressBarBg: { height: 7, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 999 },
  dadosGrid: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dadosGridCompact: { flexWrap: 'wrap', rowGap: 14 },
  dadoCol: { flex: 1, minWidth: 120 },
  dadoColCompact: { width: '50%', flexBasis: '50%' as any },
  dadoLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  dadoValue: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 3 },
  cardArrow: { width: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFDFF' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 28,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#64748B', fontSize: 12, marginTop: 6, textAlign: 'center', maxWidth: 430 },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
