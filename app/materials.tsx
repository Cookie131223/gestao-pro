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

import { C, F, R } from '../constants/brand';
import { useObras } from '../context/ObraContext';
import { parseBRL } from '../lib/currency';

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
    if (!obra) return;
    const parsedValue = parseBRL(valor);

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
          <Feather name="arrow-left" size={20} color={C.onGraphite} />
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
                placeholderTextColor={C.inkMute}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Quantidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 150 sacos"
                placeholderTextColor={C.inkMute}
                value={quantidade}
                onChangeText={setQuantidade}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor total (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 4875,00"
                placeholderTextColor={C.inkMute}
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={salvar}>
            <Feather name="plus" size={16} color={C.accentInk} />
            <Text style={styles.primaryText}>Adicionar material</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Materiais cadastrados</Text>

          {obra.materiais.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="package" size={28} color={C.inkMute} />
              <Text style={styles.emptyTitle}>Nenhum material cadastrado</Text>
              <Text style={styles.emptyText}>Adicione o primeiro item acima.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {obra.materiais.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <Feather name="box" size={18} color={C.accentText} />
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
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 22, backgroundColor: C.graphite },
  iconButton: { width: 40, height: 40, borderRadius: R.sm, backgroundColor: C.graphite3, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.body, color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontFamily: F.display, color: C.onGraphite, fontSize: 28, fontWeight: '700' },
  content: { padding: 22, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  summaryGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 220, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 18 },
  summaryLabel: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, fontWeight: '600' },
  summaryValue: { fontFamily: F.display, color: C.ink, fontSize: 30, fontWeight: '700', marginTop: 4 },
  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 20 },
  panelTitle: { fontFamily: F.display, color: C.ink, fontSize: 22, fontWeight: '700' },
  panelSub: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, marginTop: 2, marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 210 },
  label: { fontFamily: F.body, color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { fontFamily: F.body, height: 46, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, backgroundColor: C.surface2, paddingHorizontal: 12, color: C.ink, fontSize: 15 },
  primaryButton: { marginTop: 16, height: 44, alignSelf: 'flex-start', paddingHorizontal: 18, borderRadius: R.sm, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 14 },
  list: { marginTop: 14, gap: 8 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 12, backgroundColor: C.surface2 },
  itemIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: F.body, color: C.ink, fontSize: 15, fontWeight: '700' },
  itemMeta: { fontFamily: F.body, color: C.inkSoft, fontSize: 13, marginTop: 1 },
  itemValue: { fontFamily: F.display, color: C.ink, fontSize: 20, fontWeight: '700' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 34 },
  emptyTitle: { fontFamily: F.display, color: C.ink, fontSize: 20, fontWeight: '700', marginTop: 10 },
  emptyText: { fontFamily: F.body, color: C.inkSoft, fontSize: 14, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
});
