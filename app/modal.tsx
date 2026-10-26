import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { C, F, R } from '../constants/brand';
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
      statusColor: C.accent,
      borderColor: C.accent,
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
          <Feather name="x" size={20} color={C.inkSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        
        {/* Campo: Nome da Obra */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Obra *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Edifício Bella Vista / Casa Jd. Flores"
            placeholderTextColor={C.inkMute}
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
            placeholderTextColor={C.inkMute}
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
            placeholderTextColor={C.inkMute}
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
            placeholderTextColor={C.inkMute}
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
            <Feather name="check" size={16} color={C.accentInk} style={{ marginRight: 6 }} />
            <Text style={styles.textSalvar}>Salvar Obra</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surface, padding: 24, borderTopWidth: 4, borderTopColor: C.accent },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 24 },
  title: { fontFamily: F.display, fontSize: 30, fontWeight: '700', color: C.ink },
  closeButton: { padding: 8, backgroundColor: C.surface2, borderRadius: R.sm, borderWidth: 1, borderColor: C.line },
  formContainer: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontFamily: F.body, fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 8 },
  input: { fontFamily: F.body, height: 46, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 14, fontSize: 15, color: C.ink, backgroundColor: C.surface2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingBottom: 24 },
  btnCancelar: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: R.sm, borderWidth: 1, borderColor: C.lineStrong, justifyContent: 'center' },
  textCancelar: { fontFamily: F.body, color: C.inkSoft, fontSize: 14, fontWeight: '600' },
  btnSalvar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accent, paddingVertical: 11, paddingHorizontal: 20, borderRadius: R.sm },
  textSalvar: { fontFamily: F.body, color: C.accentInk, fontSize: 14, fontWeight: '700' }
});
