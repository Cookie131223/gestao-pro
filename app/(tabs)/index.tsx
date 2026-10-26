import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import Anel from '../../components/marca/Anel';
import BarraOrcamento from '../../components/marca/BarraOrcamento';
import Predio3D from '../../components/marca/Predio3D';
import { C, F, R, corOrcamento, corStatusObra, lerData, moeda, sombra } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';
import { Obra, useObras } from '../../context/ObraContext';
import { createGestaoPhotoSignedUrl } from '../../lib/supabase-api';

// animação de entrada (web) — atributo data-entra definido no _layout
const entra = (_i: number) => (Platform.OS === 'web' ? ({ dataSet: { entra: '1' } } as any) : {});
const atraso = (i: number) => (Platform.OS === 'web' ? ({ animationDelay: `${i * 60}ms` } as any) : null);

function diasAte(previsao: string) {
  const fim = lerData(previsao);
  if (!fim) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((fim.getTime() - hoje.getTime()) / 86400000);
}
function textoPrazo(previsao: string) {
  const d = diasAte(previsao);
  if (d === null) return 'Prazo a definir';
  if (d < 0) return `${-d} dia(s) de atraso`;
  if (d === 0) return 'Entrega hoje';
  return `${d} dia(s) para a entrega`;
}

// capa de cada obra = foto mais recente da galeria (link temporário assinado)
function useCapas(obras: Obra[]) {
  const { session, getAccessToken } = useAuth();
  const [capas, setCapas] = useState<Record<string, string>>({});
  const chave = obras.map((o) => `${o.id}:${o.fotos[o.fotos.length - 1] || ''}`).join('|');
  useEffect(() => {
    let ativo = true;
    if (!session) return;
    (async () => {
      let token: string;
      try { token = await getAccessToken(); } catch { return; }
      const pares = await Promise.all(obras.filter((o) => o.fotos.length).map(async (o) => {
        try { return [o.id, await createGestaoPhotoSignedUrl(token, o.fotos[o.fotos.length - 1], 3600)] as const; } catch { return [o.id, ''] as const; }
      }));
      if (ativo) setCapas(Object.fromEntries(pares.filter(([, u]) => u)));
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, session?.access_token]);
  return capas;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { obras, loading, syncing, lastSync, syncError, retrySync, syncConflicts, resolveSync } = useObras();
  const [search, setSearch] = useState('');
  const [destaqueId, setDestaqueId] = useState<string | null>(null);
  const capas = useCapas(obras);

  const compact = width < 720;
  const largo = width >= 1180;

  const obrasAtivas = obras.filter((o) => o.status === 'Em Andamento').length;
  const atrasadas = obras.filter((o) => o.status === 'Atrasada');
  const orcamentoTotal = obras.reduce((acc, o) => acc + o.orcamento, 0);
  const gastoTotal = obras.reduce((acc, o) => acc + o.gasto, 0);
  const percentualGastoGlobal = orcamentoTotal > 0 ? Math.round((gastoTotal / orcamentoTotal) * 100) : 0;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const lista = !query ? obras : obras.filter((obra) =>
      [obra.nome, obra.cliente, obra.endereco, obra.fase].join(' ').toLowerCase().includes(query)
    );
    // atrasadas primeiro, concluídas por último
    const ordem = (o: Obra) => (o.status === 'Atrasada' ? 0 : o.status === 'Concluída' ? 2 : 1);
    return [...lista].sort((a, b) => ordem(a) - ordem(b));
  }, [obras, search]);

  const destaque = obras.find((o) => o.id === destaqueId) || obras.find((o) => o.status === 'Em Andamento') || obras[0];

  const usuario = (session?.user.email?.split('@')[0] || 'gestor').replace(/[\d._-]+/g, ' ').trim().split(' ')[0] || 'gestor';
  const firstName = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const abrir = (obra: Obra) => router.push({ pathname: '/details', params: { id: obra.id, nome: obra.nome, fase: obra.fase } });

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator>
        {/* cabeçalho */}
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>VISÃO GERAL · {hoje.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{saudacao}, {firstName}</Text>
            <Text style={styles.headerSub}>Acompanhe obras, custos e cronograma em um único painel.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.btnNovaObra} onPress={() => router.push('/modal')}>
            <Feather name="plus" size={17} color={C.accentInk} />
            <Text style={styles.btnText}>Nova obra</Text>
          </TouchableOpacity>
        </View>

        {/* sincronização */}
        <View style={styles.syncRow}>
          <View style={styles.syncBadge}>
            {syncing ? <ActivityIndicator size="small" color={C.accentText} /> : <Feather name={syncError ? 'cloud-off' : 'cloud'} size={14} color={syncError ? C.bad : C.ok} />}
            <Text style={styles.syncText}>
              {syncError ? 'Sincronização pendente' : syncing
                ? 'Sincronizando...'
                : lastSync
                  ? `Sincronizado às ${lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Aguardando sincronização'}
            </Text>
          </View>
          {syncError && (
            <View style={styles.syncErro}>
              <Text accessibilityRole="alert" style={{ color: C.bad, fontSize: 13, fontFamily: F.body }}>{syncError}</Text>
              {syncConflicts > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <TouchableOpacity accessibilityRole="button" disabled={syncing} onPress={() => resolveSync('local')} style={styles.btnEscuro}>
                    <Text style={styles.btnEscuroTxt}>Priorizar minhas alterações</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" disabled={syncing} onPress={() => resolveSync('remote')} style={styles.btnEscuro}>
                    <Text style={styles.btnEscuroTxt}>Priorizar alterações da nuvem</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity accessibilityRole="button" disabled={syncing} onPress={retrySync} style={[styles.btnEscuro, { alignSelf: 'flex-start' }]}>
                  <Text style={styles.btnEscuroTxt}>{syncing ? 'Sincronizando...' : 'Tentar novamente'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* destaque com o prédio 3D */}
        {!loading && (
          <View style={[styles.hero, !largo && styles.heroColuna, atraso(0)]} {...entra(0)}>
            <View style={[styles.heroCena, !largo && { minHeight: compact ? 260 : 320 }]}>
              <Predio3D progresso={destaque?.progresso ?? 0} tema="escuro" vitrine={!destaque} style={StyleSheet.absoluteFill} />
              <View style={styles.heroRotulo} pointerEvents="none">
                <Text style={styles.heroEyebrow}>{destaque ? 'OBRA EM DESTAQUE' : 'COMECE POR AQUI'}</Text>
                <Text style={styles.heroNome} numberOfLines={1}>{destaque ? destaque.nome : 'Sua primeira obra'}</Text>
              </View>
              {Platform.OS === 'web' && <Text style={styles.heroDica} pointerEvents="none">arraste para girar</Text>}
            </View>

            <View style={[styles.heroInfo, !largo && styles.heroInfoColuna]}>
              {destaque ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                    <Text style={styles.heroNumero}>{destaque.progresso}<Text style={styles.heroNumeroPct}>%</Text></Text>
                    <Text style={styles.heroNumeroLegenda}>concluído</Text>
                  </View>
                  <View style={styles.heroLinhas}>
                    {[
                      ['flag', 'Fase', destaque.fase],
                      ['clock', 'Prazo', textoPrazo(destaque.previsao)],
                      ['user', 'Cliente', destaque.cliente],
                    ].map(([icone, rotulo, valor]) => (
                      <View key={rotulo} style={styles.heroLinha}>
                        <Feather name={icone as any} size={15} color={C.accent} />
                        <Text style={styles.heroLinhaRotulo}>{rotulo}</Text>
                        <Text style={styles.heroLinhaValor} numberOfLines={1}>{valor}</Text>
                      </View>
                    ))}
                  </View>
                  <BarraOrcamento gasto={destaque.gasto} orcamento={destaque.orcamento} escuro />
                  {obras.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 2 }}>
                      {obras.map((o) => (
                        <TouchableOpacity key={o.id} accessibilityRole="button" accessibilityState={{ selected: o.id === destaque.id }} onPress={() => setDestaqueId(o.id)}
                          style={[styles.heroChip, o.id === destaque.id && styles.heroChipAtivo]}>
                          <Text style={[styles.heroChipTxt, o.id === destaque.id && { color: C.accentInk }]} numberOfLines={1}>{o.nome}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  <TouchableOpacity accessibilityRole="button" style={styles.heroBotao} onPress={() => abrir(destaque)}>
                    <Text style={styles.heroBotaoTxt}>Abrir obra</Text>
                    <Feather name="arrow-right" size={16} color={C.accentInk} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.heroVazioTitulo}>Cadastre uma obra e veja o prédio subir conforme as tarefas são concluídas.</Text>
                  <TouchableOpacity accessibilityRole="button" style={styles.heroBotao} onPress={() => router.push('/modal')}>
                    <Text style={styles.heroBotaoTxt}>Cadastrar obra</Text>
                    <Feather name="arrow-right" size={16} color={C.accentInk} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* indicadores */}
        <View style={styles.metricsGrid}>
          {[
            { label: 'Obras ativas', value: String(obrasAtivas), icon: 'briefcase', accent: C.accentText, fundo: C.accentSoft },
            { label: 'Atrasadas', value: String(atrasadas.length), icon: 'alert-triangle', accent: atrasadas.length ? C.bad : C.inkMute, fundo: atrasadas.length ? C.badSoft : C.surface2 },
            { label: 'Orçamento total', value: moeda(orcamentoTotal), icon: 'pie-chart', accent: C.info, fundo: C.infoSoft },
            { label: 'Gasto acumulado', value: moeda(gastoTotal), icon: 'trending-up', accent: corOrcamento(percentualGastoGlobal), fundo: C.surface2, pct: percentualGastoGlobal },
          ].map((item, i) => (
            <View key={item.label} style={[styles.metricCard, compact && styles.metricCardCompact, atraso(i + 1)]} {...entra(i + 1)}>
              <View style={styles.metricTopo}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <View style={[styles.metricIconBox, { backgroundColor: item.fundo }]}>
                  <Feather name={item.icon as any} size={16} color={item.accent} />
                </View>
              </View>
              <Text style={styles.metricValue} numberOfLines={1}>{item.value}</Text>
              {item.pct !== undefined && (
                <View style={{ marginTop: 8 }}>
                  <View style={styles.barraFundo}><View style={[styles.barraCheia, { width: `${Math.min(100, item.pct)}%`, backgroundColor: item.accent }]} /></View>
                  <Text style={styles.metricSubtext}>{item.pct}% do orçamento</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* alerta de atrasos */}
        {atrasadas.length > 0 && (
          <View style={[styles.alerta, atraso(5)]} {...entra(5)}>
            <View style={styles.alertaFaixa} />
            <Feather name="alert-triangle" size={20} color={C.bad} />
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={styles.alertaTitulo}>{atrasadas.length === 1 ? '1 obra atrasada precisa de atenção' : `${atrasadas.length} obras atrasadas precisam de atenção`}</Text>
              <Text style={styles.alertaTexto} numberOfLines={2}>{atrasadas.map((o) => o.nome).join(' · ')}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.btnEscuro} onPress={() => abrir(atrasadas[0])}>
              <Text style={styles.btnEscuroTxt}>Ver obra</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* lista de obras */}
        <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
          <View>
            <Text style={styles.sectionTitle}>Minhas obras</Text>
            <Text style={styles.sectionSub}>{obras.length} projeto(s) cadastrado(s)</Text>
          </View>
          <View style={[styles.searchBox, compact && styles.searchBoxCompact]}>
            <Feather name="search" size={16} color={C.inkMute} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar obra, cliente ou fase..."
              placeholderTextColor={C.inkMute}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Buscar obras"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.emptyTitle}>Carregando suas obras...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name={search ? 'search' : 'folder-plus'} size={24} color={C.accentText} />
            </View>
            <Text style={styles.emptyTitle}>{search ? 'Nenhuma obra encontrada' : 'Comece sua primeira obra'}</Text>
            <Text style={styles.emptyText}>
              {search ? 'Tente buscar por outro nome, cliente ou etapa.' : 'Cadastre um projeto para acompanhar orçamento, tarefas e progresso.'}
            </Text>
            {!search && (
              <TouchableOpacity accessibilityRole="button" style={[styles.btnNovaObra, { marginTop: 16 }]} onPress={() => router.push('/modal')}>
                <Text style={styles.btnText}>Cadastrar obra</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filtered.map((obra, i) => {
              const st = corStatusObra(obra.status);
              return (
                <TouchableOpacity
                  key={obra.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${obra.nome}`}
                  activeOpacity={0.85}
                  style={[styles.obraCard, largo ? styles.obraCardMeio : styles.obraCardCheio, atraso(i + 6)]}
                  onPress={() => abrir(obra)}
                  {...entra(i + 6)}
                >
                  <View style={styles.capa}>
                    {capas[obra.id] ? (
                      <Image source={{ uri: capas[obra.id] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <View style={styles.capaVazia}>
                        <Feather name="home" size={30} color={C.graphite3} />
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: st.fundo }]}>
                      <View style={[styles.statusDot, { backgroundColor: st.cor }]} />
                      <Text style={[styles.statusText, { color: st.cor }]}>{obra.status}</Text>
                    </View>
                  </View>

                  <View style={styles.obraBody}>
                    <View style={styles.obraTopo}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.obraNome} numberOfLines={1}>{obra.nome}</Text>
                        <Text style={styles.infoText} numberOfLines={1}>{obra.cliente} · {obra.endereco}</Text>
                        <View style={styles.fasePill}>
                          <Feather name="flag" size={11} color={C.inkSoft} />
                          <Text style={styles.faseValue}>{obra.fase}</Text>
                        </View>
                      </View>
                      <Anel valor={obra.progresso} tamanho={62} espessura={6} />
                    </View>

                    <BarraOrcamento gasto={obra.gasto} orcamento={obra.orcamento} />

                    <View style={styles.dadosLinha}>
                      <View style={styles.dado}><Feather name="calendar" size={12} color={C.inkMute} /><Text style={styles.dadoValue}>Início {obra.inicio}</Text></View>
                      <View style={styles.dado}><Feather name="clock" size={12} color={diasAte(obra.previsao) !== null && diasAte(obra.previsao)! < 0 ? C.bad : C.inkMute} /><Text style={styles.dadoValue}>{textoPrazo(obra.previsao)}</Text></View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 32, paddingBottom: 60, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  contentCompact: { padding: 16, paddingBottom: 90 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  headerCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 14 },
  eyebrow: { fontFamily: F.body, color: C.accentText, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  headerTitle: { fontFamily: F.display, color: C.ink, fontSize: 36, fontWeight: '700', letterSpacing: 0.2 },
  headerSub: { fontFamily: F.body, color: C.inkSoft, fontSize: 15, marginTop: 2 },
  btnNovaObra: { height: 44, paddingHorizontal: 18, borderRadius: R.sm, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: F.body, color: C.accentInk, fontSize: 14, fontWeight: '700' },
  syncRow: { alignItems: 'flex-start', marginBottom: 20, gap: 10 },
  syncBadge: { minHeight: 30, paddingHorizontal: 11, borderRadius: R.sm, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 7 },
  syncText: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, fontWeight: '600' },
  syncErro: { gap: 8, padding: 12, borderRadius: R.md, backgroundColor: C.badSoft, alignSelf: 'stretch' },
  btnEscuro: { backgroundColor: C.graphite, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.sm },
  btnEscuroTxt: { fontFamily: F.body, color: C.onGraphite, fontWeight: '700', fontSize: 13 },

  // destaque
  hero: { flexDirection: 'row', backgroundColor: C.graphite, borderRadius: R.lg, overflow: 'hidden', marginBottom: 18, minHeight: 360, ...sombra },
  heroColuna: { flexDirection: 'column' },
  heroCena: { flex: 1.35, minHeight: 360, position: 'relative' },
  heroRotulo: { position: 'absolute', left: 20, top: 18, right: 20 },
  heroEyebrow: { fontFamily: F.body, color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  heroNome: { fontFamily: F.display, color: C.onGraphite, fontSize: 26, fontWeight: '700', marginTop: 2 },
  heroDica: { position: 'absolute', right: 16, bottom: 12, fontFamily: F.body, color: C.onGraphiteDim, fontSize: 11, opacity: 0.7 },
  heroInfo: { flex: 1, padding: 24, gap: 6, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.graphite3, backgroundColor: C.graphite2 },
  heroInfoColuna: { borderLeftWidth: 0, borderTopWidth: 1, borderTopColor: C.graphite3 },
  heroNumero: { fontFamily: F.display, color: C.accent, fontSize: 64, fontWeight: '700', lineHeight: 64 },
  heroNumeroPct: { fontSize: 32 },
  heroNumeroLegenda: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 14, marginBottom: 8 },
  heroLinhas: { gap: 8, marginTop: 10 },
  heroLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroLinhaRotulo: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 13, width: 58 },
  heroLinhaValor: { fontFamily: F.body, color: C.onGraphite, fontSize: 14, fontWeight: '600', flex: 1 },
  heroChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.sm, borderWidth: 1, borderColor: C.graphite3, maxWidth: 180 },
  heroChipAtivo: { backgroundColor: C.accent, borderColor: C.accent },
  heroChipTxt: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 12, fontWeight: '600' },
  heroBotao: { marginTop: 14, height: 44, borderRadius: R.sm, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroBotaoTxt: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 14 },
  heroVazioTitulo: { fontFamily: F.display, color: C.onGraphite, fontSize: 24, fontWeight: '600', lineHeight: 30 },

  // indicadores
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  metricCard: { flex: 1, minWidth: 220, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 18 },
  metricCardCompact: { minWidth: '100%' as any },
  metricTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, fontWeight: '600' },
  metricValue: { fontFamily: F.display, color: C.ink, fontSize: 30, fontWeight: '700', marginTop: 6 },
  metricSubtext: { fontFamily: F.body, color: C.inkMute, fontSize: 12, marginTop: 5 },

  alerta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: '#F0C9C5', borderRadius: R.lg, padding: 16, paddingLeft: 22, marginBottom: 26, overflow: 'hidden' },
  alertaFaixa: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: C.bad },
  alertaTitulo: { fontFamily: F.body, color: C.ink, fontSize: 15, fontWeight: '700' },
  alertaTexto: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, marginTop: 2 },

  // lista
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 16, marginTop: 8 },
  sectionHeaderCompact: { flexDirection: 'column', alignItems: 'stretch' },
  sectionTitle: { fontFamily: F.display, color: C.ink, fontSize: 26, fontWeight: '700' },
  sectionSub: { fontFamily: F.body, color: C.inkMute, fontSize: 13, marginTop: 2 },
  searchBox: { width: 320, height: 44, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchBoxCompact: { width: '100%' },
  searchInput: { flex: 1, color: C.ink, fontSize: 14, fontFamily: F.body, outlineStyle: 'none' } as any,
  cardsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  obraCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, overflow: 'hidden', ...sombra },
  obraCardMeio: { width: '48.9%' as any, flexGrow: 1 },
  obraCardCheio: { width: '100%' },
  capa: { height: 128, backgroundColor: C.graphite, position: 'relative' },
  capaVazia: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.graphite2 },
  statusBadge: { position: 'absolute', left: 12, top: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 9, borderRadius: R.sm },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: F.body, fontSize: 12, fontWeight: '700' },
  obraBody: { padding: 18 },
  obraTopo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  obraNome: { fontFamily: F.display, color: C.ink, fontSize: 22, fontWeight: '700' },
  infoText: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, marginTop: 1 },
  fasePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingVertical: 4, paddingHorizontal: 8 },
  faseValue: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, fontWeight: '600' },
  barraFundo: { height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 4 },
  dadosLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line },
  dado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dadoValue: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', minHeight: 260, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: F.display, color: C.ink, fontSize: 22, fontWeight: '700', marginTop: 10 },
  emptyText: { fontFamily: F.body, color: C.inkSoft, fontSize: 14, marginTop: 4, textAlign: 'center', maxWidth: 430 },
});
