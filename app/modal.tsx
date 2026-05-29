import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useObras } from '../context/ObraContext';

export default function ModalScreen() {
  const router = useRouter();
  const { adicionarObra } = useObras(); // Extrai a função de salvar
  
  const [nomeObra, setNomeObra] = useState('');
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [orcamento, setOrcamento] = useState('')

 const handleSalvar = () => {
    if (!nomeObra || !cliente) {
      alert('Por favor, preencha o nome da obra e do cliente.');
      return;
    }
    adicionarObra({
      nome: nomeObra,
      cliente: cliente,
      endereco: endereco || 'Endereço não informado',
      orcamento: orcamento ? parseFloat(orcamento) : 0,
      status: 'Em Andamento',
      statusColor: '#3B82F6',
      borderColor: '#3B82F6',
      fase: 'Planejamento',
      progresso: 0,
      inicio: new Date().toLocaleDateString('pt-BR'), // Data atual automática
      previsao: 'A definir'
    });
    
    // Aqui futuramente você pode integrar com o seu banco de dados ou estado global
    alert(`Obra "${nomeObra}" cadastrada com sucesso!`);
    router.back(); // Fecha o modal e volta para o Dashboard atualizado!
  };

  return (
    <View style={styles.container}>
      
      {/* Header do Modal */}
      <View style={styles.header}>
        <Text style={styles.title}>Cadastrar Nova Obra</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        
        {/* Campo: Nome da Obra */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Obra *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Edifício Bella Vista / Casa Jd. Flores"
            placeholderTextColor="#94A3B8"
            value={nomeObra}
            onChangeText={setNomeObra}
          />
        </View>

        {/* Campo: Cliente */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Cliente</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: João Silva dos Santos"
            placeholderTextColor="#94A3B8"
            value={cliente}
            onChangeText={setCliente}
          />
        </View>

        {/* Campo: Endereço */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço da Obra</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Av. Principal, 123 - Centro"
            placeholderTextColor="#94A3B8"
            value={endereco}
            onChangeText={setEndereco}
          />
        </View>

        {/* Campo: Orçamento */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Orçamento Estimado (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 250.000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={orcamento}
            onChangeText={setOrcamento}
          />
        </View>

        {/* Botões de Ação */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => router.back()}>
            <Text style={styles.textCancelar}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar}>
            <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.textSalvar}>Salvar Obra</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  closeButton: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 8 },
  formContainer: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingBottom: 24 },
  btnCancelar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center' },
  textCancelar: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  btnSalvar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  textSalvar: { color: '#FFF', fontSize: 13, fontWeight: '600' }
});