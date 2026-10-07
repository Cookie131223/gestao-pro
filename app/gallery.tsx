import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useObras } from '../context/ObraContext';
import { createGestaoPhotoSignedUrl, uploadGestaoPhoto } from '../lib/supabase-api';

export default function GalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const { obras, adicionarFoto } = useObras();

  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find((item) => item.id === obraId);

  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    (async () => {
      if (!obra || !session) return;

      const entries = await Promise.all(
        obra.fotos.map(async (path) => {
          try {
            const url = await createGestaoPhotoSignedUrl(session.access_token, path, 3600);
            return [path, url] as const;
          } catch {
            return [path, ''] as const;
          }
        })
      );

      if (active) setUrls(Object.fromEntries(entries));
    })();

    return () => {
      active = false;
    };
  }, [obra?.fotos, session?.access_token]);

  if (!obra || !session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Obra não encontrada.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function adicionarImagem() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para continuar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const path = await uploadGestaoPhoto(
        session.access_token,
        session.user.id,
        obra.id,
        asset.fileName || `foto-${Date.now()}.jpg`,
        blob,
        asset.mimeType || 'image/jpeg'
      );

      adicionarFoto(obra.id, path);

      const signed = await createGestaoPhotoSignedUrl(session.access_token, path, 3600);
      setUrls((current) => ({ ...current, [path]: signed }));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível adicionar a foto.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>GALERIA</Text>
          <Text style={styles.title}>{obra.nome}</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={adicionarImagem} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.primaryText}>Adicionar foto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {obra.fotos.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Feather name="image" size={28} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma foto cadastrada</Text>
            <Text style={styles.emptyText}>Adicione imagens da evolução da obra para acompanhar o histórico.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={adicionarImagem}>
              <Text style={styles.primaryText}>Adicionar primeira foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {obra.fotos.map((path, index) => (
              <View key={path} style={styles.photoCard}>
                {urls[path] ? (
                  <Image source={{ uri: urls[path] }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <ActivityIndicator color="#2563EB" />
                  </View>
                )}
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTitle}>Foto {index + 1}</Text>
                  <Text style={styles.photoMeta}>Armazenada na nuvem</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  primaryButton: { minHeight: 42, paddingHorizontal: 15, borderRadius: 10, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  content: { padding: 22, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  photoCard: { width: 280, maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  image: { width: '100%', height: 190, backgroundColor: '#E2E8F0' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoInfo: { padding: 12 },
  photoTitle: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  photoMeta: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  emptyBox: { minHeight: 320, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 26 },
  emptyIcon: { width: 54, height: 54, borderRadius: 15, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 14 },
  emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', maxWidth: 420, marginTop: 6, marginBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 14 },
});
