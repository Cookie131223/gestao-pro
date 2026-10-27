import Icone3D from '../components/marca/Icone3D';
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
import { C, F, R } from '../constants/brand';
import { useObras } from '../context/ObraContext';
import { createGestaoPhotoSignedUrl, uploadGestaoPhoto } from '../lib/supabase-api';

export default function GalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session, getAccessToken } = useAuth();
  const { obras, adicionarFoto } = useObras();

  const obraId = Array.isArray(params.id) ? params.id[0] : params.id;
  const obra = obras.find((item) => item.id === obraId);

  const [uploading, setUploading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    (async () => {
      if (!obra || !session) return;

      let token: string;
      try { token = await getAccessToken(); } catch {
        if (active) setUrls(Object.fromEntries(obra.fotos.map((path) => [path, ''])));
        return;
      }
      const entries = await Promise.all(
        obra.fotos.map(async (path) => {
          try {
            const url = await createGestaoPhotoSignedUrl(token, path, 3600);
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
  }, [obra?.fotos, session?.access_token, retryCount]);

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
    if (!obra || !session) return;
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
        await getAccessToken(),
        session.user.id,
        obra.id,
        asset.fileName || `foto-${Date.now()}.jpg`,
        blob,
        asset.mimeType || 'image/jpeg'
      );

      adicionarFoto(obra.id, path);

      const signed = await createGestaoPhotoSignedUrl(await getAccessToken(), path, 3600);
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
          <Feather name="arrow-left" size={20} color={C.onGraphite} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 150 }}>
          <Text style={styles.eyebrow}>GALERIA</Text>
          <Text style={styles.title}>{obra.nome}</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={adicionarImagem} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={C.accentInk} />
          ) : (
            <>
              <Feather name="camera" size={16} color={C.accentInk} />
              <Text style={styles.primaryText}>Adicionar foto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {obra.fotos.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icone3D nome="imagem" tamanho={44} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma foto cadastrada</Text>
            <Text style={styles.emptyText}>Adicione imagens da evolução da obra para acompanhar o histórico.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={adicionarImagem} disabled={uploading}>
              <Text style={styles.primaryText}>Adicionar primeira foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {obra.fotos.map((path, index) => (
              <View key={path} style={styles.photoCard}>
                {urls[path] ? (
                  <Image source={{ uri: urls[path] }} style={styles.image} resizeMode="cover" />
                ) : urls[path] === '' ? (
                  <TouchableOpacity accessibilityRole="button" onPress={() => setRetryCount((value) => value + 1)} style={[styles.image, styles.imagePlaceholder]}>
                    <Text style={{ color: C.bad, textAlign: 'center', fontFamily: F.body }}>Não foi possível carregar. Toque para tentar novamente.</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <ActivityIndicator color={C.accent} />
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
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: 22, backgroundColor: C.graphite },
  iconButton: { width: 40, height: 40, borderRadius: R.sm, backgroundColor: C.graphite3, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.body, color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontFamily: F.display, color: C.onGraphite, fontSize: 28, fontWeight: '700' },
  primaryButton: { minHeight: 44, paddingHorizontal: 18, borderRadius: R.sm, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 14 },
  content: { padding: 22, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  photoCard: { width: 290, flexGrow: 1, maxWidth: 420, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  image: { width: '100%', height: 210, backgroundColor: C.graphite2 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  photoInfo: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoTitle: { fontFamily: F.display, color: C.ink, fontSize: 18, fontWeight: '700' },
  photoMeta: { fontFamily: F.body, color: C.inkMute, fontSize: 12 },
  emptyBox: { minHeight: 320, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', padding: 26 },
  emptyIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: F.display, color: C.ink, fontSize: 22, fontWeight: '700', marginTop: 12 },
  emptyText: { fontFamily: F.body, color: C.inkSoft, fontSize: 14, textAlign: 'center', maxWidth: 420, marginTop: 4, marginBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 14 },
});
