import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import Logo from '../components/marca/Logo';
import { C } from '../constants/brand';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ObraProvider } from '../context/ObraContext';

// Web: idioma, fontes da marca (Barlow) e cor de fundo da página.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.lang = 'pt-BR';
  if (!document.getElementById('fontes-marca')) {
    const pre = document.createElement('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = 'anonymous';
    const css = document.createElement('link'); css.id = 'fontes-marca'; css.rel = 'stylesheet';
    css.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap';
    const estilo = document.createElement('style');
    estilo.textContent = `body{background:${C.bg};font-family:'Barlow',system-ui,sans-serif}
      input,textarea{font-family:'Barlow',system-ui,sans-serif}
      @keyframes gpEntra{from{opacity:0;transform:translateY(8px)}}
      [data-entra]{animation:gpEntra .45s cubic-bezier(.2,.8,.2,1) both}
      @media (prefers-reduced-motion: reduce){[data-entra]{animation:none}}`;
    document.head.append(pre, css, estilo);
  }
  const tema = document.querySelector('meta[name="theme-color"]') || Object.assign(document.createElement('meta'), { name: 'theme-color' });
  tema.setAttribute('content', C.graphite); document.head.appendChild(tema);
}

function Navigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const onLogin = segments[0] === 'login';

    if (!session && !onLogin) {
      router.replace('/login');
    } else if (session && onLogin) {
      router.replace('/');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Logo tamanho={56} />
        <ActivityIndicator size="small" color={C.accent} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <ObraProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ title: 'Entrar · GestãoPro' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Nova obra · GestãoPro' }} />
        <Stack.Screen name="materials" options={{ title: 'Materiais · GestãoPro' }} />
        <Stack.Screen name="gallery" options={{ title: 'Fotos · GestãoPro' }} />
      </Stack>
    </ObraProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.graphite },
});
