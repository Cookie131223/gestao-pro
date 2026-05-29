// app/gallery.tsx
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function GalleryScreen() {
  const router = useRouter();
  const fotos = [
    { titulo: 'Fundação concluída', data: '09 de fevereiro de 2026', tag: 'Estrutura' },
    { titulo: 'Estrutura de concreto', data: '24 de fevereiro de 2026', tag: 'Estrutura' },
    { titulo: 'Alvenaria em progresso', data: '04 de março de 2026', tag: 'Estrutura' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color={COLORS.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Galeria de Fotos</Text>
      </View>

      <View style={styles.photoGrid}>
        {fotos.map((f, i) => (
          <View key={i} style={styles.photoCard}>
            <View style={styles.placeholderImg}>
              <Feather name="image" size={24} color={COLORS.border} />
              <View style={styles.tag}><Text style={styles.tagText}>{f.tag}</Text></View>
            </View>
            <View style={styles.photoInfo}>
              <Text style={styles.photoTitle}>{f.titulo}</Text>
              <Text style={styles.photoData}>{f.data}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  photoCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: 'hidden' },
  placeholderImg: { height: 160, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  tag: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.warning, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  tagText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  photoInfo: { padding: 14 },
  photoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  photoData: { fontSize: 12, color: COLORS.textMuted }
});