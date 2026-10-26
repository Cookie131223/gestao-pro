// app/(tabs)/explore.tsx — Cronograma: gráfico de Gantt + lista de tarefas
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { C, F, R, iniciais, lerData } from '../../constants/brand';
import { useObras } from '../../context/ObraContext';

const DIA = 86400000;
const corStatus = { 'Concluído': C.ok, 'Em Andamento': C.accent, 'Pendente': C.lineStrong } as const;
const STATUS = ['Pendente', 'Em Andamento', 'Concluído'] as const;

export default function CronogramaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { obras, atualizarStatusTarefa } = useObras();
  const [filtro, setFiltro] = useState('');

  // 🛠️ Junta todas as tarefas de todas as obras em uma lista única
  const todasAsTarefas = obras
    .filter((obra) => !filtro || obra.id === filtro)
    .flatMap(obra => obra.tarefas.map(tarefa => ({ ...tarefa, obraNome: obra.nome, obraId: obra.id })));

  const totalTarefas = todasAsTarefas.length;
  const emAndamento = todasAsTarefas.filter(t => t.status === 'Em Andamento').length;
  const pendentes = todasAsTarefas.filter(t => t.status === 'Pendente').length;
  const concluidas = todasAsTarefas.filter(t => t.status === 'Concluído').length;

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const atrasada = (t: { prazo: string; status: string }) => { const p = lerData(t.prazo); return !!p && p < hoje && t.status !== 'Concluído'; };

  // ---------- Gantt ----------
  const gantt = useMemo(() => {
    const itens = todasAsTarefas
      .map((t) => ({ ...t, ini: lerData(t.inicio), fim: lerData(t.prazo) }))
      .filter((t) => t.ini && t.fim)
      .sort((a, b) => a.ini!.getTime() - b.ini!.getTime()) as (typeof todasAsTarefas[number] & { ini: Date; fim: Date })[];
    if (!itens.length) return null;
    let min = Math.min(hoje.getTime(), ...itens.map((t) => t.ini.getTime())) - 2 * DIA;
    let max = Math.max(hoje.getTime(), ...itens.map((t) => t.fim.getTime())) + 3 * DIA;
    if (max - min < 14 * DIA) max = min + 14 * DIA;
    const total = max - min;
    const pos = (d: number) => ((d - min) / total) * 100;
    const marcas = Array.from({ length: 7 }, (_, i) => min + (total * i) / 6);
    return { itens, pos, marcas, hojePos: pos(hoje.getTime()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obras, filtro]);

  const fmt = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const larguraRotulo = compact ? 130 : 230;

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.content, compact && { padding: 16, paddingBottom: 90 }]} showsVerticalScrollIndicator>
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.eyebrow}>PLANEJAMENTO</Text>
            <Text style={styles.pageTitle}>Cronograma geral</Text>
            <Text style={styles.pageSub}>Linha do tempo de todas as tarefas, com o dia de hoje marcado.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: '/tasks', params: { create: '1' } })} style={styles.btnPrimario}>
            <Feather name="plus" size={17} color={C.accentInk} />
            <Text style={styles.btnPrimarioTxt}>Adicionar tarefa</Text>
          </TouchableOpacity>
        </View>

        {obras.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
            {[{ id: '', nome: 'Todas as obras' }, ...obras].map((o) => (
              <TouchableOpacity key={o.id} accessibilityRole="button" accessibilityState={{ selected: filtro === o.id }} onPress={() => setFiltro(o.id)} style={[styles.chip, filtro === o.id && styles.chipAtivo]}>
                <Text style={[styles.chipTxt, filtro === o.id && styles.chipTxtAtivo]}>{o.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* resumo */}
        <View style={styles.gridSummary}>
          {[
            ['Total', totalTarefas, C.ink],
            ['Em andamento', emAndamento, C.accentText],
            ['Pendentes', pendentes, C.inkSoft],
            ['Concluídas', concluidas, C.ok],
          ].map(([rotulo, valor, cor]) => (
            <View key={rotulo as string} style={styles.miniCard}>
              <Text style={styles.miniLabel}>{rotulo}</Text>
              <Text style={[styles.miniVal, { color: cor as string }]}>{valor}</Text>
            </View>
          ))}
        </View>

        {todasAsTarefas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={36} color={C.inkMute} />
            <Text style={styles.emptyTitle}>Nenhuma tarefa no cronograma</Text>
            <Text style={styles.emptyText}>Adicione tarefas com início e prazo para ver a linha do tempo.</Text>
          </View>
        ) : (
          <>
            {/* gráfico de Gantt */}
            {gantt && (
              <View style={styles.painel}>
                <View style={styles.painelTopo}>
                  <Text style={styles.painelTitulo}>Linha do tempo</Text>
                  <View style={styles.legenda}>
                    {[['Pendente', C.lineStrong], ['Em andamento', C.accent], ['Concluída', C.ok], ['Atrasada', C.bad]].map(([n, c]) => (
                      <View key={n} style={styles.legendaItem}><View style={[styles.legendaCor, { backgroundColor: c }]} /><Text style={styles.legendaTxt}>{n}</Text></View>
                    ))}
                  </View>
                </View>
                <ScrollView horizontal={compact} showsHorizontalScrollIndicator={compact}>
                  <View style={{ minWidth: compact ? 640 : undefined, width: compact ? 640 : '100%' }}>
                    {/* régua de datas */}
                    <View style={styles.ganttLinha}>
                      <View style={{ width: larguraRotulo }} />
                      <View style={styles.ganttArea}>
                        {gantt.marcas.map((m, i) => (
                          <Text key={i} style={[styles.regua, { left: `${(i / 6) * 100}%` as any }, i === 6 && { transform: [{ translateX: -40 }] }]}>{fmt(m)}</Text>
                        ))}
                      </View>
                    </View>
                    {gantt.itens.map((t) => {
                      const esq = gantt.pos(t.ini.getTime()), dir = gantt.pos(t.fim.getTime() + DIA);
                      const cor = atrasada(t) ? C.bad : corStatus[t.status];
                      return (
                        <View key={`${t.obraId}:${t.id}`} style={styles.ganttLinha}>
                          <View style={{ width: larguraRotulo, paddingRight: 10 }}>
                            <Text style={styles.ganttTitulo} numberOfLines={1}>{t.titulo}</Text>
                            <Text style={styles.ganttObra} numberOfLines={1}>{t.obraNome}</Text>
                          </View>
                          <View style={[styles.ganttArea, styles.ganttGrade]}>
                            {gantt.marcas.map((_, i) => <View key={i} style={[styles.gradeLinha, { left: `${(i / 6) * 100}%` as any }]} />)}
                            <View style={[styles.ganttBarra, { left: `${esq}%` as any, width: `${Math.max(1.5, dir - esq)}%` as any, backgroundColor: cor }]}>
                              <Text style={[styles.ganttBarraTxt, { color: t.status === 'Pendente' && !atrasada(t) ? C.ink : t.status === 'Em Andamento' && !atrasada(t) ? C.accentInk : '#fff' }]} numberOfLines={1}>
                                {iniciais(t.responsavel)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    {/* linha de hoje */}
                    <View pointerEvents="none" style={[styles.hojeCamada, { left: larguraRotulo }]}>
                      <View style={[styles.hojeLinha, { left: `${gantt.hojePos}%` as any }]}>
                        <Text style={styles.hojeTxt}>HOJE</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* lista com troca rápida de situação */}
            <Text style={styles.secao}>Todas as tarefas</Text>
            {todasAsTarefas.map((tarefa) => (
              <View key={`${tarefa.obraId}:${tarefa.id}`} style={[styles.taskCard, { borderLeftColor: atrasada(tarefa) ? C.bad : tarefa.prioridade === 'Alta' ? C.bad : tarefa.prioridade === 'Média' ? C.accent : C.lineStrong }]}>
                <View style={styles.taskHeader}>
                  <View style={styles.titleContainer}>
                    <Feather
                      name={tarefa.status === 'Concluído' ? 'check-circle' : tarefa.status === 'Em Andamento' ? 'clock' : 'circle'}
                      size={17}
                      color={tarefa.status === 'Concluído' ? C.ok : tarefa.status === 'Em Andamento' ? C.accentText : C.inkMute}
                      style={{ marginRight: 10, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{tarefa.titulo}</Text>
                      {!!tarefa.descricao && <Text style={styles.taskDesc}>{tarefa.descricao}</Text>}
                      <Text style={styles.taskMeta}>{tarefa.obraNome} · {tarefa.responsavel} · {tarefa.inicio} → <Text style={atrasada(tarefa) ? { color: C.bad, fontWeight: '700' } : undefined}>{tarefa.prazo}{atrasada(tarefa) ? ' (atrasada)' : ''}</Text></Text>
                    </View>
                  </View>

                  <View style={styles.segmentado}>
                    {STATUS.map((status) => (
                      <TouchableOpacity
                        key={status}
                        accessibilityRole="button"
                        accessibilityLabel={`${tarefa.titulo}: marcar como ${status}`}
                        accessibilityState={{ selected: tarefa.status === status }}
                        style={[styles.segmento, tarefa.status === status && { backgroundColor: status === 'Concluído' ? C.ok : status === 'Em Andamento' ? C.accent : C.graphite }]}
                        onPress={() => atualizarStatusTarefa(tarefa.obraId, tarefa.id, status)}
                      >
                        <Text style={[styles.segmentoTxt, tarefa.status === status && { color: status === 'Em Andamento' ? C.accentInk : '#fff' }]}>{status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: C.bg },
  scrollContainer: { flex: 1 },
  content: { padding: 32, paddingBottom: 60, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 18 },
  eyebrow: { fontFamily: F.body, color: C.accentText, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  pageTitle: { fontFamily: F.display, fontSize: 36, fontWeight: '700', color: C.ink },
  pageSub: { fontFamily: F.body, fontSize: 15, color: C.inkSoft },
  btnPrimario: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, height: 44, paddingHorizontal: 18, borderRadius: R.sm },
  btnPrimarioTxt: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 14 },
  filtros: { gap: 8, paddingBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.sm, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  chipAtivo: { backgroundColor: C.graphite, borderColor: C.graphite },
  chipTxt: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, fontWeight: '600' },
  chipTxtAtivo: { color: C.onGraphite },
  gridSummary: { flexDirection: 'row', gap: 12, marginBottom: 18, flexWrap: 'wrap' },
  miniCard: { flex: 1, minWidth: 130, backgroundColor: C.surface, padding: 16, borderRadius: R.lg, borderWidth: 1, borderColor: C.line },
  miniLabel: { fontFamily: F.body, fontSize: 13, color: C.inkSoft, fontWeight: '600' },
  miniVal: { fontFamily: F.display, fontSize: 32, fontWeight: '700', marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 6, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line },
  emptyTitle: { fontFamily: F.display, color: C.ink, fontSize: 22, fontWeight: '700', marginTop: 6 },
  emptyText: { fontFamily: F.body, color: C.inkSoft, fontSize: 14 },

  painel: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 20, marginBottom: 22 },
  painelTopo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  painelTitulo: { fontFamily: F.display, fontSize: 22, fontWeight: '700', color: C.ink },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendaCor: { width: 12, height: 8, borderRadius: 2 },
  legendaTxt: { fontFamily: F.body, fontSize: 12, color: C.inkSoft },
  ganttLinha: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  ganttArea: { flex: 1, height: 40, position: 'relative', justifyContent: 'center' },
  ganttGrade: { backgroundColor: C.surface2, borderTopWidth: 1, borderTopColor: C.surface },
  gradeLinha: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: C.line },
  regua: { position: 'absolute', top: 14, fontFamily: F.body, fontSize: 11, color: C.inkMute, fontWeight: '600' },
  ganttTitulo: { fontFamily: F.body, fontSize: 13, fontWeight: '700', color: C.ink },
  ganttObra: { fontFamily: F.body, fontSize: 11, color: C.inkMute },
  ganttBarra: { position: 'absolute', height: 22, borderRadius: 5, justifyContent: 'center', paddingHorizontal: 6, overflow: 'hidden' },
  ganttBarraTxt: { fontFamily: F.body, fontSize: 10, fontWeight: '700' },
  hojeCamada: { position: 'absolute', top: 40, bottom: 0, right: 0 },
  hojeLinha: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: C.bad },
  hojeTxt: { position: 'absolute', top: -16, left: -14, fontFamily: F.body, fontSize: 10, fontWeight: '700', color: C.bad, letterSpacing: 0.6 },

  secao: { fontFamily: F.display, fontSize: 24, fontWeight: '700', color: C.ink, marginBottom: 12 },
  taskCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4 },
  taskHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
  titleContainer: { flex: 1, minWidth: 220, flexDirection: 'row', alignItems: 'flex-start' },
  taskTitle: { fontFamily: F.body, fontSize: 16, fontWeight: '700', color: C.ink },
  taskDesc: { fontFamily: F.body, fontSize: 13, color: C.inkSoft, marginTop: 1 },
  taskMeta: { fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 4 },
  segmentado: { flexDirection: 'row', borderRadius: R.sm, borderWidth: 1, borderColor: C.line, overflow: 'hidden', backgroundColor: C.surface2 },
  segmento: { paddingVertical: 8, paddingHorizontal: 11 },
  segmentoTxt: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, fontWeight: '600' },
});
