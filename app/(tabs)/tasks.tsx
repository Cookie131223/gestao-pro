import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Tarefa, useObras } from '../../context/ObraContext';
import { validateTask } from '../../lib/task-form';

const columns: { status: Tarefa['status']; title: string; color: string }[] = [
  { status: 'Pendente', title: 'A fazer', color: '#64748B' },
  { status: 'Em Andamento', title: 'Em andamento', color: '#2563EB' },
  { status: 'Concluído', title: 'Concluídas', color: '#15803D' },
];
const priorities: Tarefa['prioridade'][] = ['Baixa', 'Média', 'Alta'];
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
            <Feather name="plus" size={18} color="#FFF" /><Text style={styles.primaryText}>Adicionar tarefa</Text>
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
        {!!syncError && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/')} style={styles.warning}><Text style={{ color: '#B91C1C' }}>Há alterações pendentes de sincronização. Abra o painel para revisar.</Text></TouchableOpacity>}
        {syncing && <Text style={styles.subtitle}>Sincronizando alterações...</Text>}
        {loading ? <ActivityIndicator accessibilityLabel="Carregando tarefas" size="large" color="#2563EB" /> : !obras.length ? (
          <View style={styles.empty}><Text style={styles.cardTitle}>Cadastre um projeto para começar</Text><Text style={styles.subtitle}>As tarefas ficam vinculadas a uma obra.</Text><TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => router.push('/modal')}><Text style={styles.primaryText}>Cadastrar projeto</Text></TouchableOpacity></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled contentContainerStyle={styles.board}>
            {columns.map((column) => {
              const items = tasks.filter((task) => task.status === column.status);
              return <View key={column.status} style={[styles.column, { width: columnWidth, borderTopColor: column.color }]}>
                <View style={styles.columnHeader}><Text accessibilityRole="header" style={styles.columnTitle}>{column.title} · {items.length}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Adicionar tarefa em ${column.title}`} style={styles.smallButton} onPress={() => openForm(column.status)}><Feather name="plus" size={18} color={column.color} /></TouchableOpacity></View>
                {!items.length && <Text style={styles.subtitle}>Nenhuma tarefa nesta coluna.</Text>}
                {items.map((task) => <View key={`${task.obraId}:${task.id}`} style={styles.card}>
                  <Text style={[styles.priority, { color: task.prioridade === 'Alta' ? '#B91C1C' : '#475569' }]}>{task.prioridade} prioridade</Text>
                  <Text style={styles.cardTitle}>{task.titulo}</Text>
                  {!!task.descricao && <Text style={styles.description}>{task.descricao}</Text>}
                  <Text style={styles.metadata}>{task.obraNome}</Text><Text style={styles.metadata}>Responsável: {task.responsavel}</Text><Text style={styles.metadata}>Prazo: {task.prazo}</Text>
                  <View style={styles.moves}>{columns.filter((target) => target.status !== task.status).map((target) => <TouchableOpacity key={target.status} accessibilityRole="button" accessibilityLabel={`Mover ${task.titulo} para ${target.title}`} style={styles.move} onPress={() => atualizarStatusTarefa(task.obraId, task.id, target.status)}><Text style={styles.moveText}>→ {target.title}</Text></TouchableOpacity>)}</View>
                </View>)}
              </View>;
            })}
          </ScrollView>
        )}
      </ScrollView>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.dialogHeader}><Text accessibilityRole="header" style={styles.columnTitle}>Adicionar tarefa ao projeto</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar formulário" style={styles.smallButton} onPress={() => setVisible(false)}><Feather name="x" size={20} color="#475569" /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              <Text style={styles.label}>Projeto *</Text>
              <View style={styles.options}>{obras.map((obra) => <TouchableOpacity key={obra.id} accessibilityRole="button" accessibilityState={{ selected: projectId === obra.id }} onPress={() => setProjectId(obra.id)} style={[styles.chip, projectId === obra.id && styles.chipActive]}><Text style={projectId === obra.id ? styles.chipActiveText : styles.chipText}>{obra.nome}</Text></TouchableOpacity>)}</View>
              {([
                ['titulo', 'Título *', 'Ex.: Instalar iluminação'], ['descricao', 'Descrição', 'O que precisa ser feito?'], ['responsavel', 'Responsável *', 'Nome da pessoa ou equipe'], ['categoria', 'Etapa / categoria', 'Ex.: Instalações'], ['inicio', 'Início *', 'DD/MM/AAAA'], ['prazo', 'Prazo *', 'DD/MM/AAAA'],
              ] as const).map(([key, label, placeholder]) => <View key={key}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoFocus={key === 'titulo'} style={[styles.input, key === 'descricao' && styles.multiline]} placeholder={placeholder} placeholderTextColor="#64748B" value={draft[key]} multiline={key === 'descricao'} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))} /></View>)}
              <Text style={styles.label}>Prioridade</Text><View style={styles.options}>{priorities.map((priority) => <TouchableOpacity key={priority} accessibilityRole="button" accessibilityState={{ selected: draft.prioridade === priority }} style={[styles.chip, draft.prioridade === priority && styles.chipActive]} onPress={() => setDraft((current) => ({ ...current, prioridade: priority }))}><Text style={draft.prioridade === priority ? styles.chipActiveText : styles.chipText}>{priority}</Text></TouchableOpacity>)}</View>
              <Text style={styles.label}>Situação inicial</Text><View style={styles.options}>{columns.map((column) => <TouchableOpacity key={column.status} accessibilityRole="button" accessibilityState={{ selected: draft.status === column.status }} style={[styles.chip, draft.status === column.status && styles.chipActive]} onPress={() => setDraft((current) => ({ ...current, status: column.status }))}><Text style={draft.status === column.status ? styles.chipActiveText : styles.chipText}>{column.title}</Text></TouchableOpacity>)}</View>
              {!!error && <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>{error}</Text>}
              <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={saveTask}><Text style={styles.primaryText}>Salvar tarefa</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 20, paddingBottom: 48, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }, eyebrow: { color: '#2563EB', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#0F172A', fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: '#64748B', fontSize: 13, lineHeight: 20 },
  primary: { backgroundColor: '#2563EB', borderRadius: 10, minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  filters: { gap: 8, paddingBottom: 10 }, chip: { padding: 10, minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 9, backgroundColor: '#FFF' }, chipActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }, chipText: { color: '#475569', fontSize: 13 }, chipActiveText: { color: '#1D4ED8', fontSize: 13, fontWeight: '700' },
  board: { gap: 16, paddingBottom: 16, alignItems: 'flex-start' }, column: { backgroundColor: '#F1F5F9', borderRadius: 12, borderTopWidth: 4, padding: 14, gap: 12, minHeight: 260 }, columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, columnTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', flexShrink: 1 }, smallButton: { padding: 10, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 15, gap: 7, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' }, cardTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' }, priority: { fontSize: 11, fontWeight: '700' }, description: { color: '#475569', fontSize: 13, lineHeight: 19 }, metadata: { color: '#64748B', fontSize: 12 }, moves: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }, move: { padding: 10, minHeight: 42, borderRadius: 8, backgroundColor: '#EFF6FF' }, moveText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  empty: { backgroundColor: '#FFF', padding: 24, gap: 14, borderRadius: 12 }, notice: { color: '#166534', fontSize: 13 }, warning: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8 },
  overlay: { flex: 1, backgroundColor: '#0F172A99', justifyContent: 'center', alignItems: 'center', padding: 16 }, dialog: { backgroundColor: '#FFF', width: '100%', maxWidth: 620, maxHeight: '90%', borderRadius: 16, flexShrink: 1 }, dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }, form: { padding: 20, gap: 12 }, label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 8, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }, multiline: { minHeight: 80, textAlignVertical: 'top' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
