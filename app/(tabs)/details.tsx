// app/(tabs)/details.tsx
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import BarraOrcamento from '../../components/marca/BarraOrcamento';
import Predio3D from '../../components/marca/Predio3D';
import { C, F, R, corStatusObra, iniciais, lerData, moeda, sombra } from '../../constants/brand';
import { useObras } from '../../context/ObraContext';

const corTarefa = { 'Concluído': C.ok, 'Em Andamento': C.accent, 'Pendente': C.inkMute } as const;

export default function DetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const largo = width >= 1100;
  const params = useLocalSearchParams();
  const { obras } = useObras();

  // Garante a captura correta do ID vindo do clique no Dashboard
  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find(o => o.id === obraId);

  if (!obra) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={30} color={C.inkMute} />
        <Text style={styles.errorText}>Obra não encontrada ou removida.</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.btnPrimario} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnPrimarioTxt}>Voltar ao painel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // prazo real a partir das datas da obra
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const inicio = lerData(obra.inicio), fim = lerData(obra.previsao);
  const decorridos = inicio ? Math.max(0, Math.round((hoje.getTime() - inicio.getTime()) / 86400000)) : null;
  const restantes = fim ? Math.round((fim.getTime() - hoje.getTime()) / 86400000) : null;
  const prazoTexto = restantes === null ? 'A definir' : restantes < 0 ? `${-restantes} dias de atraso` : restantes === 0 ? 'Entrega hoje' : `${restantes} dias restantes`;

  const saldoDisponivel = obra.orcamento - obra.gasto;
  const st = corStatusObra(obra.status);
  const concluidas = obra.tarefas.filter((t) => t.status === 'Concluído').length;

  return (
    <View style={styles.mainContainer}>
      {/* cabeçalho */}
      <View style={[styles.topHeader, compact && styles.topHeaderCompact]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar ao painel" onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={C.onGraphite} />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.eyebrow}>OBRA · {obra.fase.toUpperCase()}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{obra.nome}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{obra.cliente} · {obra.endereco}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.fundo }]}>
          <View style={[styles.statusDot, { backgroundColor: st.cor }]} />
          <Text style={[styles.badgeText, { color: st.cor }]}>{obra.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.scrollContent, compact && { padding: 16 }]} showsVerticalScrollIndicator>
        {/* prédio 3D + indicadores */}
        <View style={[styles.linha, !largo && { flexDirection: 'column' }]}>
          <View style={[styles.cena, !largo && { minHeight: compact ? 280 : 340 }]}>
            <Predio3D progresso={obra.progresso} tema="escuro" style={StyleSheet.absoluteFill} />
            <View style={styles.cenaRotulo} pointerEvents="none">
              <Text style={styles.cenaNumero}>{obra.progresso}%</Text>
              <Text style={styles.cenaLegenda}>{concluidas} de {obra.tarefas.length} tarefa(s) concluída(s)</Text>
            </View>
          </View>

          <View style={[styles.indicadores, largo && { width: 360 }]}>
            {[
              { icone: 'user', rotulo: 'Cliente', valor: obra.cliente, cor: C.info },
              { icone: 'map-pin', rotulo: 'Localização', valor: obra.endereco, cor: C.inkSoft },
              { icone: 'calendar', rotulo: 'Prazo', valor: prazoTexto, sub: decorridos !== null ? `${decorridos} dias decorridos · entrega ${obra.previsao}` : `Entrega ${obra.previsao}`, cor: restantes !== null && restantes < 0 ? C.bad : C.accentText },
              { icone: 'flag', rotulo: 'Fase atual', valor: obra.fase, sub: `Início em ${obra.inicio}`, cor: C.ok },
            ].map((c) => (
              <View key={c.rotulo} style={styles.indicatorCard}>
                <View style={[styles.indicatorIcone, { backgroundColor: c.cor + '1A' }]}>
                  <Feather name={c.icone as any} size={16} color={c.cor} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardLabel}>{c.rotulo}</Text>
                  <Text style={[styles.cardMainValue, c.rotulo === 'Prazo' && { color: c.cor }]} numberOfLines={2}>{c.valor}</Text>
                  {!!c.sub && <Text style={styles.cardSubtext}>{c.sub}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.linha, !largo && { flexDirection: 'column' }]}>
          {/* financeiro + ações */}
          <View style={[styles.painel, { flex: 1.1 }]}>
            <View style={styles.panelHeader}>
              <Feather name="dollar-sign" size={18} color={C.ok} />
              <Text style={styles.panelTitle}>Visão financeira</Text>
            </View>
            <View style={styles.finGrid}>
              {[
                ['Orçamento total', moeda(obra.orcamento), C.ink],
                ['Valor gasto', moeda(obra.gasto), C.ink],
                ['Saldo disponível', moeda(saldoDisponivel), saldoDisponivel < 0 ? C.bad : C.ok],
              ].map(([rotulo, valor, cor]) => (
                <View key={rotulo} style={styles.finItem}>
                  <Text style={styles.finLabel}>{rotulo}</Text>
                  <Text style={[styles.finValor, { color: cor }]} numberOfLines={1}>{valor}</Text>
                </View>
              ))}
            </View>
            <BarraOrcamento gasto={obra.gasto} orcamento={obra.orcamento} />

            <View style={styles.acoes}>
              <TouchableOpacity accessibilityRole="button" style={styles.btnPrimario} onPress={() => router.push({ pathname: '/tasks', params: { id: obra.id, create: '1' } })}>
                <Feather name="plus" size={16} color={C.accentInk} /><Text style={styles.btnPrimarioTxt}>Adicionar tarefa</Text>
              </TouchableOpacity>
              {[
                ['columns', 'Quadro de tarefas', () => router.push({ pathname: '/tasks', params: { id: obra.id } })],
                ['calendar', 'Cronograma', () => router.push('/explore')],
                ['package', 'Materiais', () => router.push({ pathname: '/materials', params: { id: obra.id } })],
                ['camera', 'Fotos da obra', () => router.push({ pathname: '/gallery', params: { id: obra.id } })],
              ].map(([icone, rotulo, acao]) => (
                <TouchableOpacity key={rotulo as string} accessibilityRole="button" style={styles.btnSecundario} onPress={acao as () => void}>
                  <Feather name={icone as any} size={16} color={C.ink} />
                  <Text style={styles.btnSecundarioTxt}>{rotulo as string}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* linha do tempo das tarefas */}
          <View style={[styles.painel, { flex: 1 }]}>
            <View style={styles.panelHeader}>
              <Feather name="list" size={18} color={C.accentText} />
              <Text style={styles.panelTitle}>Etapas da obra</Text>
              <Text style={styles.panelContador}>{concluidas}/{obra.tarefas.length}</Text>
            </View>
            {obra.tarefas.length === 0 ? (
              <Text style={styles.vazio}>Nenhuma tarefa cadastrada. Use “Adicionar tarefa” para planejar este projeto.</Text>
            ) : (
              <View>
                {obra.tarefas.map((tarefa, i) => (
                  <View key={tarefa.id} style={styles.timelineItem}>
                    <View style={styles.timelineTrilho}>
                      <View style={[styles.timelineNo, { borderColor: corTarefa[tarefa.status] }, tarefa.status === 'Concluído' && { backgroundColor: C.ok }]}>
                        {tarefa.status === 'Concluído' && <Feather name="check" size={10} color="#fff" />}
                      </View>
                      {i < obra.tarefas.length - 1 && <View style={styles.timelineLinha} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineTitulo, tarefa.status === 'Concluído' && { color: C.inkSoft }]}>{tarefa.titulo}</Text>
                      <View style={styles.timelineMeta}>
                        <View style={styles.avatarMini}><Text style={styles.avatarMiniTxt}>{iniciais(tarefa.responsavel)}</Text></View>
                        <Text style={styles.timelineData}>{tarefa.responsavel} · prazo {tarefa.prazo}</Text>
                      </View>
                    </View>
                    <Text style={[styles.miniStatus, { color: tarefa.status === 'Em Andamento' ? C.accentText : corTarefa[tarefa.status] }]}>{tarefa.status}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <Text style={styles.rodape}>O progresso é calculado automaticamente pelas tarefas concluídas.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: C.bg },

  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingHorizontal: 28, paddingTop: 26, paddingBottom: 22, backgroundColor: C.graphite },
  topHeaderCompact: { flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 18 },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  backButton: { width: 40, height: 40, borderRadius: R.sm, backgroundColor: C.graphite3, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.body, color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  headerTitle: { fontFamily: F.display, fontSize: 30, fontWeight: '700', color: C.onGraphite },
  headerSub: { fontFamily: F.body, fontSize: 13, color: C.onGraphiteDim },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: R.sm },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: F.body, fontSize: 12, fontWeight: '700' },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 28, gap: 18, paddingBottom: 48, width: '100%', maxWidth: 1400, alignSelf: 'center' },
  linha: { flexDirection: 'row', gap: 18 },

  cena: { flex: 1, minHeight: 380, borderRadius: R.lg, overflow: 'hidden', backgroundColor: C.graphite, position: 'relative', ...sombra },
  cenaRotulo: { position: 'absolute', left: 20, top: 16 },
  cenaNumero: { fontFamily: F.display, color: C.accent, fontSize: 48, fontWeight: '700', lineHeight: 50 },
  cenaLegenda: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 13 },

  indicadores: { gap: 12 },
  indicatorCard: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: C.line, flex: 1 },
  indicatorIcone: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontFamily: F.body, fontSize: 12, color: C.inkMute, fontWeight: '600' },
  cardMainValue: { fontFamily: F.display, fontSize: 20, fontWeight: '700', color: C.ink, marginTop: 1 },
  cardSubtext: { fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 2 },

  painel: { backgroundColor: C.surface, borderRadius: R.lg, padding: 22, borderWidth: 1, borderColor: C.line },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 12 },
  panelTitle: { fontFamily: F.display, fontSize: 22, fontWeight: '700', color: C.ink, flex: 1 },
  panelContador: { fontFamily: F.display, fontSize: 18, fontWeight: '700', color: C.inkMute },

  finGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  finItem: { flex: 1, minWidth: 140, backgroundColor: C.surface2, borderRadius: R.md, padding: 12, borderWidth: 1, borderColor: C.line },
  finLabel: { fontFamily: F.body, fontSize: 12, color: C.inkMute, fontWeight: '600' },
  finValor: { fontFamily: F.display, fontSize: 22, fontWeight: '700', marginTop: 2 },

  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  btnPrimario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, height: 42, paddingHorizontal: 16, borderRadius: R.sm, gap: 8 },
  btnPrimarioTxt: { fontFamily: F.body, color: C.accentInk, fontSize: 14, fontWeight: '700' },
  btnSecundario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, height: 42, paddingHorizontal: 14, borderRadius: R.sm, gap: 8, borderWidth: 1, borderColor: C.lineStrong },
  btnSecundarioTxt: { fontFamily: F.body, color: C.ink, fontSize: 14, fontWeight: '600' },

  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineTrilho: { width: 20, alignItems: 'center' },
  timelineNo: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  timelineLinha: { width: 2, flex: 1, backgroundColor: C.line, marginVertical: 2 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineTitulo: { fontFamily: F.body, fontSize: 15, fontWeight: '700', color: C.ink },
  timelineMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  avatarMini: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center' },
  avatarMiniTxt: { fontFamily: F.body, color: C.accent, fontSize: 9, fontWeight: '700' },
  timelineData: { fontFamily: F.body, fontSize: 12, color: C.inkMute },
  miniStatus: { fontFamily: F.body, fontSize: 12, fontWeight: '700', marginTop: 2 },
  vazio: { fontFamily: F.body, fontSize: 14, color: C.inkSoft, lineHeight: 20 },

  rodape: { fontFamily: F.body, fontSize: 12, color: C.inkMute, textAlign: 'center' },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 12 },
  errorText: { fontFamily: F.body, fontSize: 15, color: C.inkSoft },
});
