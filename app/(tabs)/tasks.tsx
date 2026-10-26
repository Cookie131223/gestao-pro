import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { C, F, R, iniciais, lerData } from '../../constants/brand';
import { Tarefa, useObras } from '../../context/ObraContext';
import { validateTask } from '../../lib/task-form';

const columns: { status: Tarefa['status']; title: string; color: string }[] = [
  { status: 'Pendente', title: 'A fazer', color: C.inkSoft },
  { status: 'Em Andamento', title: 'Em andamento', color: C.accent },
  { status: 'Concluído', title: 'Concluídas', color: C.ok },
];
const priorities: Tarefa['prioridade'][] = ['Baixa', 'Média', 'Alta'];
const corPrioridade = { Alta: C.bad, 'Média': C.accent, Baixa: C.lineStrong } as const;
function vencida(prazo: string, status: Tarefa['status']) { const p = lerData(prazo); const h = new Date(); h.setHours(0, 0, 0, 0); return !!p && p < h && status !== 'Concluído'; }
function today() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}
function emptyTask(): Omit<Tarefa, 'id'> {
  return { titulo: '', descricao: '', categoria: '', responsavel: '', prioridade: 'Média', status: 'Pendente', inicio: today(), prazo: '' };
}

export default function TaskBoardScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; create?: string }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { obras, loading, adicionarTarefa, atualizarStatusTarefa, syncing, syncError } = useObras();
  const [filter, setFilter] = useState(routeId || '');
  const [visible, setVisible] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [draft, setDraft] = useState(emptyTask);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submitted = useRef(false);

  function openForm(status: Tarefa['status'] = 'Pendente', selectedId = filter) {
    submitted.current = false;
    setProjectId(selectedId || (obras.length === 1 ? obras[0].id : ''));
    setDraft({ ...emptyTask(), status });
    setError('');
    setVisible(true);
  }
  useEffect(() => {
    setFilter(routeId || '');
    if (params.create === '1') {
      submitted.current = false;
      setProjectId(routeId || '');
      setDraft(emptyTask());
      setError('');
      setVisible(true);
      router.setParams({ create: undefined });
    }
  }, [routeId, params.create, router]);

  function saveTask() {
    if (submitted.current) return;
    const validation = validateTask(projectId, draft);
    if (validation) { setError(validation); return; }
    const project = obras.find((obra) => obra.id === projectId);
    if (!project) { setError('O projeto não está disponível. Selecione outro.'); return; }
    submitted.current = true;
    adicionarTarefa(projectId, { ...draft, titulo: draft.titulo.trim(), descricao: draft.descricao.trim(), responsavel: draft.responsavel.trim(), categoria: draft.categoria.trim() || project.fase || 'Geral' });
    setFilter(projectId);
    setVisible(false);
    setNotice('Tarefa adicionada ao projeto.');
  }
  const tasks = obras.filter((obra) => !filter || obra.id === filter).flatMap((obra) => obra.tarefas.map((tarefa) => ({ ...tarefa, obraId: obra.id, obraNome: obra.nome })));
  const columnWidth = width < 720 ? Math.max(250, width - 64) : 320;

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.eyebrow}>ORGANIZAÇÃO DO PROJETO</Text>
            <Text accessibilityRole="header" style={styles.title}>Quadro de tarefas</Text>
            <Text style={styles.subtitle}>Organize o trabalho em A fazer, Em andamento e Concluídas.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" disabled={loading || !obras.length} style={[styles.primary, (loading || !obras.length) && { opacity: 0.5 }]} onPress={() => openForm()}>
            <Feather name="plus" size={18} color={C.accentInk} /><Text style={styles.primaryText}>Adicionar tarefa</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.filters}>
          {[{ id: '', nome: 'Todos os projetos' }, ...obras].map((obra) => (
            <TouchableOpacity key={obra.id} accessibilityRole="button" accessibilityState={{ selected: filter === obra.id }} onPress={() => setFilter(obra.id)} style={[styles.chip, filter === obra.id && styles.chipActive]}>
              <Text style={filter === obra.id ? styles.chipActiveText : styles.chipText}>{obra.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
        {!!syncError && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/')} style={styles.warning}><Text style={{ color: C.bad, fontFamily: F.body }}>Há alterações pendentes de sincronização. Abra o painel para revisar.</Text></TouchableOpacity>}
        {syncing && <Text style={styles.subtitle}>Sincronizando alterações...</Text>}
        {loading ? <ActivityIndicator accessibilityLabel="Carregando tarefas" size="large" color={C.accent} /> : !obras.length ? (
          <View style={styles.empty}><Text style={styles.cardTitle}>Cadastre um projeto para começar</Text><Text style={styles.subtitle}>As tarefas ficam vinculadas a uma obra.</Text><TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => router.push('/modal')}><Text style={styles.primaryText}>Cadastrar projeto</Text></TouchableOpacity></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled contentContainerStyle={styles.board}>
            {columns.map((column) => {
              const items = tasks.filter((task) => task.status === column.status);
              return <View key={column.status} style={[styles.column, { width: columnWidth, borderTopColor: column.color }]}>
                <View style={styles.columnHeader}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}><View style={[styles.columnDot, { backgroundColor: column.color }]} /><Text accessibilityRole="header" style={styles.columnTitle}>{column.title}</Text><View style={styles.contador}><Text style={styles.contadorTxt}>{items.length}</Text></View></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Adicionar tarefa em ${column.title}`} style={styles.smallButton} onPress={() => openForm(column.status)}><Feather name="plus" size={18} color={C.inkSoft} /></TouchableOpacity></View>
                {!items.length && <View style={styles.colVazia}><Text style={styles.subtitle}>Nenhuma tarefa nesta coluna.</Text></View>}
                {items.map((task) => <View key={`${task.obraId}:${task.id}`} style={styles.card}>
                  <View style={[styles.faixa, { backgroundColor: corPrioridade[task.prioridade] }]} />
                  <View style={styles.cardTopo}>
                    <Text style={[styles.priority, { color: task.prioridade === 'Alta' ? C.bad : task.prioridade === 'Média' ? C.accentText : C.inkMute }]}>{task.prioridade.toUpperCase()}</Text>
                    <Text style={styles.obraTag} numberOfLines={1}>{task.obraNome}</Text>
                  </View>
                  <Text style={[styles.cardTitle, task.status === 'Concluído' && { color: C.inkSoft }]}>{task.titulo}</Text>
                  {!!task.descricao && <Text style={styles.description}>{task.descricao}</Text>}
                  <View style={styles.cardRodape}>
                    <View style={styles.pessoa}><View style={styles.avatar}><Text style={styles.avatarTxt}>{iniciais(task.responsavel)}</Text></View><Text style={styles.metadata} numberOfLines={1}>{task.responsavel}</Text></View>
                    <View style={[styles.prazo, vencida(task.prazo, task.status) && styles.prazoVencido]}><Feather name="clock" size={11} color={vencida(task.prazo, task.status) ? C.bad : C.inkMute} /><Text style={[styles.prazoTxt, vencida(task.prazo, task.status) && { color: C.bad }]}>{task.prazo}</Text></View>
                  </View>
                  <View style={styles.moves}>{columns.filter((target) => target.status !== task.status).map((target) => <TouchableOpacity key={target.status} accessibilityRole="button" accessibilityLabel={`Mover ${task.titulo} para ${target.title}`} style={styles.move} onPress={() => atualizarStatusTarefa(task.obraId, task.id, target.status)}><Text style={styles.moveText}>{target.title} →</Text></TouchableOpacity>)}</View>
                </View>)}
              </View>;
            })}
          </ScrollView>
        )}
      </ScrollView>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.dialogHeader}><Text accessibilityRole="header" style={styles.columnTitle}>Adicionar tarefa ao projeto</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar formulário" style={styles.smallButton} onPress={() => setVisible(false)}><Feather name="x" size={20} color={C.inkSoft} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              <Text style={styles.label}>Projeto *</Text>
              <View style={styles.options}>{obras.map((obra) => <TouchableOpacity key={obra.id} accessibilityRole="button" accessibilityState={{ selected: projectId === obra.id }} onPress={() => setProjectId(obra.id)} style={[styles.chip, projectId === obra.id && styles.chipActive]}><Text style={projectId === obra.id ? styles.chipActiveText : styles.chipText}>{obra.nome}</Text></TouchableOpacity>)}</View>
              {([
                ['titulo', 'Título *', 'Ex.: Instalar iluminação'], ['descricao', 'Descrição', 'O que precisa ser feito?'], ['responsavel', 'Responsável *', 'Nome da pessoa ou equipe'], ['categoria', 'Etapa / categoria', 'Ex.: Instalações'], ['inicio', 'Início *', 'DD/MM/AAAA'], ['prazo', 'Prazo *', 'DD/MM/AAAA'],
              ] as const).map(([key, label, placeholder]) => <View key={key}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoFocus={key === 'titulo'} style={[styles.input, key === 'descricao' && styles.multiline]} placeholder={placeholder} placeholderTextColor={C.inkMute} value={draft[key]} multiline={key === 'descricao'} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))} /></View>)}
              <Text style={styles.label}>Prioridade</Text><View style={styles.options}>{priorities.map((priority) => <TouchableOpacity key={priority} accessibilityRole="button" accessibilityState={{ selected: draft.prioridade === priority }} style={[styles.chip, draft.prioridade === priority && styles.chipActive]} onPress={() => setDraft((current) => ({ ...current, prioridade: priority }))}><Text style={draft.prioridade === priority ? styles.chipActiveText : styles.chipText}>{priority}</Text></TouchableOpacity>)}</View>
              <Text style={styles.label}>Situação inicial</Text><View style={styles.options}>{columns.map((column) => <TouchableOpacity key={column.status} accessibilityRole="button" accessibilityState={{ selected: draft.status === column.status }} style={[styles.chip, draft.status === column.status && styles.chipActive]} onPress={() => setDraft((current) => ({ ...current, status: column.status }))}><Text style={draft.status === column.status ? styles.chipActiveText : styles.chipText}>{column.title}</Text></TouchableOpacity>)}</View>
              {!!error && <Text accessibilityRole="alert" style={{ color: C.bad, fontFamily: F.body }}>{error}</Text>}
              <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={saveTask}><Text style={styles.primaryText}>Salvar tarefa</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { padding: 28, paddingBottom: 90, gap: 16, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }, eyebrow: { fontFamily: F.body, color: C.accentText, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, title: { fontFamily: F.display, color: C.ink, fontSize: 36, fontWeight: '700' }, subtitle: { fontFamily: F.body, color: C.inkSoft, fontSize: 14, lineHeight: 20 },
  primary: { backgroundColor: C.accent, borderRadius: R.sm, minHeight: 44, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryText: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 14 },
  filters: { gap: 8, paddingBottom: 4 }, chip: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 38, justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: R.sm, backgroundColor: C.surface }, chipActive: { borderColor: C.graphite, backgroundColor: C.graphite }, chipText: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, fontWeight: '600' }, chipActiveText: { fontFamily: F.body, color: C.onGraphite, fontSize: 13, fontWeight: '700' },
  board: { gap: 16, paddingBottom: 16, alignItems: 'flex-start' }, column: { backgroundColor: '#ECE8E0', borderRadius: R.lg, padding: 12, gap: 10, minHeight: 260 }, columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4 }, columnDot: { width: 10, height: 10, borderRadius: 3 }, columnTitle: { fontFamily: F.display, color: C.ink, fontSize: 20, fontWeight: '700', flexShrink: 1 }, contador: { minWidth: 24, height: 22, borderRadius: 11, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 }, contadorTxt: { fontFamily: F.body, fontSize: 12, fontWeight: '700', color: C.inkSoft }, smallButton: { padding: 10, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: R.sm },
  colVazia: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.lineStrong, borderRadius: R.md, padding: 16, alignItems: 'center' },
  card: { padding: 14, paddingLeft: 17, gap: 6, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, overflow: 'hidden', shadowColor: '#1D2024', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, faixa: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, obraTag: { fontFamily: F.body, fontSize: 11, color: C.inkMute, flexShrink: 1 },
  cardTitle: { fontFamily: F.body, color: C.ink, fontSize: 15, fontWeight: '700' }, priority: { fontFamily: F.body, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }, description: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, lineHeight: 19 },
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 }, pessoa: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }, avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center' }, avatarTxt: { fontFamily: F.body, color: C.accent, fontSize: 10, fontWeight: '700' }, metadata: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, flexShrink: 1 },
  prazo: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: R.sm, backgroundColor: C.surface2 }, prazoVencido: { backgroundColor: C.badSoft }, prazoTxt: { fontFamily: F.body, fontSize: 11, fontWeight: '600', color: C.inkSoft },
  moves: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line }, move: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: R.sm, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line }, moveText: { fontFamily: F.body, color: C.ink, fontSize: 12, fontWeight: '600' },
  empty: { backgroundColor: C.surface, padding: 24, gap: 14, borderRadius: R.lg, borderWidth: 1, borderColor: C.line }, notice: { fontFamily: F.body, color: C.ok, fontSize: 13, fontWeight: '600' }, warning: { backgroundColor: C.badSoft, padding: 12, borderRadius: R.md },
  overlay: { flex: 1, backgroundColor: 'rgba(29,32,36,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 }, dialog: { backgroundColor: C.surface, width: '100%', maxWidth: 620, maxHeight: '90%', borderRadius: R.lg, flexShrink: 1, overflow: 'hidden' }, dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line, borderTopWidth: 4, borderTopColor: C.accent }, form: { padding: 20, gap: 12 }, label: { fontFamily: F.body, color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { fontFamily: F.body, borderColor: C.line, borderWidth: 1, borderRadius: R.sm, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.ink, backgroundColor: C.surface2 }, multiline: { minHeight: 80, textAlignVertical: 'top' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
