// app/materials.tsx
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function MaterialsScreen() {
  const router = useRouter();
  const lista = [
    { nome: 'Cimento CP-II 50kg', qtd: '150 saco', valor: 'R$ 32.50', total: 'R$ 4.875,00', status: 'Entregue' },
    { nome: 'Tijolo Baiano 6 furos', qtd: '8000 un', valor: 'R$ 0.85', total: 'R$ 6.800,00', status: 'Entregue' },
    { nome: 'Areia Média', qtd: '20 m³', valor: 'R$ 95.00', total: 'R$ 1.900,00', status: 'Em Trânsito' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color={COLORS.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Controle de Materiais</Text>
      </View>

      {/* Resumo Mini Cards */}
      <View style={styles.miniGrid}>
        <View style={[styles.mCard, { borderLeftColor: COLORS.primary }]}><Text style={styles.mLabel}>Total Materiais</Text><Text style={styles.mVal}>5</Text></View>
        <View style={[styles.mCard, { borderLeftColor: COLORS.success }]}><Text style={styles.mLabel}>Entregues</Text><Text style={styles.mVal}>3</Text></View>
        <View style={[styles.mCard, { borderLeftColor: COLORS.info }]}><Text style={styles.mLabel}>Em Trânsito</Text><Text style={styles.mVal}>1</Text></View>
        <View style={[styles.mCard, { borderLeftColor: COLORS.warning }]}><Text style={styles.mLabel}>Custo Total</Text><Text style={styles.mVal}>R$ 20.7k</Text></View>
      </View>

      {/* Lista Real em Cards Similares a Tabela */}
      <Text style={styles.sectionTitle}>Lista de Materiais</Text>
      {lista.map((item, idx) => (
        <View key={idx} style={styles.itemCard}>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.nome}</Text>
            <View style={[styles.badge, { backgroundColor: item.status === 'Entregue' ? COLORS.success : COLORS.primary }]}><Text style={styles.badgeText}>{item.status}</Text></View>
          </View>
          <Text style={styles.itemSub}>Qtd: {item.qtd} | Unit: {item.valor}</Text>
          <Text style={styles.itemTotal}>Total: {item.total}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  mCard: { width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4 },
  mLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  mVal: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 14 },
  itemCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  itemSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  itemTotal: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMain }
});