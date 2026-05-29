// app/(tabs)/explore.tsx
import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useObras } from '../../context/ObraContext';

export default function CronogramaScreen() {
  const { obras, atualizarStatusTarefa } = useObras();

  // 🛠️ Mapeia e junta todas as tarefas de todas as obras em uma lista única
  const todasAsTarefas = obras.flatMap(obra => 
    obra.tarefas.map(tarefa => ({
      ...tarefa,
      obraNome: obra.nome,
      obraId: obra.id,
      borderColor: obra.borderColor
    }))
  );

  // 🧮 Estatísticas do Cronograma baseadas nos dados reais
  const totalTarefas = todasAsTarefas.length;
  const emAndamento = todasAsTarefas.filter(t => t.status === 'Em Andamento').length;
  const pendentes = todasAsTarefas.filter(t => t.status === 'Pendente').length;
  const concluidas = todasAsTarefas.filter(t => t.status === 'Concluído').length;

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.pageTitle}>Cronograma Geral</Text>

        {/* Mini Cards de Status Dinâmicos */}
        <View style={styles.gridSummary}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Total</Text>
            <Text style={styles.miniVal}>{totalTarefas}</Text>
          </View>
          <View style={[styles.miniCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.miniLabel}>Em Andamento</Text>
            <Text style={[styles.miniVal, { color: '#3B82F6' }]}>{emAndamento}</Text>
          </View>
          <View style={[styles.miniCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.miniLabel}>Pendentes</Text>
            <Text style={[styles.miniVal, { color: '#F59E0B' }]}>{pendentes}</Text>
          </View>
          <View style={[styles.miniCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.miniLabel}>Concluídas</Text>
            <Text style={[styles.miniVal, { color: '#10B981' }]}>{concluidas}</Text>
          </View>
        </View>

        {/* Mensagem amigável caso não tenha nenhuma tarefa criada */}
        {todasAsTarefas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clipboard" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>Nenhuma tarefa cadastrada no cronograma.</Text>
          </View>
        ) : (
          /* Lista de Tarefas do Cronograma */
          todasAsTarefas.map((tarefa) => (
            <View 
              key={tarefa.id} 
              style={[
                styles.taskCard, 
                { borderLeftColor: tarefa.prioridade === 'Alta' ? '#EF4444' : '#F59E0B' }
              ]}
            >
              <View style={styles.taskHeader}>
                <View style={styles.titleContainer}>
                  <Feather 
                    name={tarefa.status === 'Concluído' ? "check-circle" : tarefa.status === 'Em Andamento' ? "clock" : "file-text"} 
                    size={16} 
                    color={tarefa.status === 'Concluído' ? '#10B981' : tarefa.status === 'Em Andamento' ? '#3B82F6' : '#64748B'} 
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{tarefa.titulo}</Text>
                    <Text style={styles.taskDesc}>{tarefa.descricao}</Text>
                  </View>
                </View>

                {/* Botão Interativo para Alternar Status da Tarefa ao Clicar */}
                <TouchableOpacity 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: tarefa.status === 'Concluído' ? '#10B981' : tarefa.status === 'Em Andamento' ? '#3B82F6' : '#64748B' }
                  ]}
                  onPress={() => {
                    // Muda o status ciclicamente: Pendente -> Em Andamento -> Concluído -> Pendente
                    const proximoStatus = 
                      tarefa.status === 'Pendente' ? 'Em Andamento' : 
                      tarefa.status === 'Em Andamento' ? 'Concluído' : 'Pendente';
                    atualizarStatusTarefa(tarefa.obraId, tarefa.id, proximoStatus);
                  }}
                >
                  <Text style={styles.badgeText}>{tarefa.status} 🔄</Text>
                </TouchableOpacity>
              </View>

              {/* Grid de Informações Internas */}
              <View style={styles.infoGrid}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Obra Alvo</Text>
                  <Text style={styles.infoValue}>{tarefa.obraNome}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Responsável</Text>
                  <Text style={styles.infoValue}>{tarefa.responsavel}</Text>
                </View>
              </View>

              {/* Datas no Rodapé */}
              <View style={styles.taskFooter}>
                <View style={styles.dateBlock}>
                  <Feather name="calendar" size={14} color="#64748B" />
                  <Text style={styles.dateText}>Início: {tarefa.inicio}</Text>
                </View>
                <View style={styles.dateBlock}>
                  <Feather name="clock" size={14} color="#64748B" />
                  <Text style={styles.dateText}>Prazo: {tarefa.prazo}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flex: 1, padding: 24, paddingTop: 32 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 24 },
  gridSummary: { flexDirection: 'row', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  miniCard: { flex: 1, minWidth: '22%', backgroundColor: '#FFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: '#64748B' },
  miniLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  miniVal: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: '#64748B', fontSize: 14 },
  taskCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  taskDesc: { fontSize: 12, color: '#64748B' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 4, gap: 12 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  taskFooter: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 4 },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#1E293B', fontWeight: '500' }
});