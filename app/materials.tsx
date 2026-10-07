import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useObras } from '../context/ObraContext';

export default function MaterialsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { obras, adicionarMaterial } = useObras();

  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find((item) => item.id === obraId);

  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');

  const total = useMemo(
    () => obra?.materiais.reduce((acc, item) => acc + item.valor, 0) || 0,
    [obra?.materiais]
  );

  if (!obra) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Obra não encontrada.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function salvar() {
    const parsedValue = Number(valor.replace(/./g, '').replace(',', '.'));

    if (!nome.trim() || !quantidade.trim() || !Number.isFinite(parsedValue) || parsedValue <= 0) {
      Alert.alert('Atenção', 'Preencha nome, quantidade e valor corretamente.');
      return;
    }

    adicionarMaterial(obra.id, {
      nome: nome.trim(),
      quantidade: quantidade.trim(),
      valor: parsedValue,
    });

    setNome('');
    setQuantidade('');
    setValor('');
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>MATERIAIS</Text>
          <Text style={styles.title}>{obra.nome}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Itens cadastrados</Text>
            <Text style={styles.summaryValue}>{obra.materiais.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Custo acumulado</Text>
            <Text style={styles.summaryValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Adicionar material</Text>
          <Text style={styles.panelSub}>Os valores entram automaticamente no gasto total da obra.</Text>

          <View style={styles.formRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Cimento CP-II 50kg"
                placeholderTextColor="#94A3B8"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Quantidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 150 sacos"
                placeholderTextColor="#94A3B8"
                value={quantidade}
                onChangeText={setQuantidade}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor total (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 4875,00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={salvar}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.primaryText}>Adicionar material</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Materiais cadastrados</Text>

          {obra.materiais.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="package" size={24} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Nenhum material cadastrado</Text>
              <Text style={styles.emptyText}>Adicione o primeiro item acima.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {obra.materiais.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <Feather name="box" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.nome}</Text>
                    <Text style={styles.itemMeta}>{item.quantidade}</Text>
                  </View>
                  <Text style={styles.itemValue}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#2563EB', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0F172A', fontSize: 20, fontWeight: '800', marginTop: 2 },
  content: { padding: 22, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  summaryGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 220, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 18 },
  summaryLabel: { color: '#64748B', fontSize: 12 },
  summaryValue: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginTop: 6 },
  panel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 20 },
  panelTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  panelSub: { color: '#64748B', fontSize: 12, marginTop: 5, marginBottom: 18 },
  formRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 210 },
  label: { color: '#475569', fontSize: 11, fontWeight: '700', marginBottom: 7 },
  input: { height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 12, color: '#0F172A' },
  primaryButton: { marginTop: 16, height: 44, alignSelf: 'flex-start', paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  list: { marginTop: 14, gap: 10 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  itemName: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  itemMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  itemValue: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 34 },
  emptyTitle: { color: '#334155', fontSize: 14, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
