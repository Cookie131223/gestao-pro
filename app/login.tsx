import Icone3D from '../components/marca/Icone3D';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import Logo from '../components/marca/Logo';
import Predio3D from '../components/marca/Predio3D';
import { C, F, R } from '../constants/brand';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha', 'Use pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      if (isRegister) {
        const result = await register(normalizedEmail, password);
        if (result === 'confirm-email') {
          setMessage('Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.');
          setIsRegister(false);
          return;
        }
      } else {
        await login(normalizedEmail, password);
      }

      router.replace('/');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  }

  const compact = width < 760;

  return (
    <View style={styles.page}>
      {!compact && (
        <View style={styles.hero}>
          <Predio3D progresso={0} vitrine tema="escuro" style={StyleSheet.absoluteFill} />
          <View style={styles.heroTexto} pointerEvents="none">
            <View style={styles.heroMarca}>
              <Logo tamanho={46} />
              <Text style={styles.heroTitle}>GESTÃO<Text style={{ color: C.accent }}>PRO</Text></Text>
            </View>
            <Text style={styles.heroText}>Obras, cronogramas, materiais e progresso em um único lugar.</Text>
          </View>
          <View style={styles.featureList} pointerEvents="none">
            {[
              ['nuvem', 'Dados sincronizados na nuvem'],
              ['grafico', 'Custos e progresso em tempo real'],
              ['cadeado', 'Conta individual e dados privados'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Icone3D nome={icon as any} tamanho={26} />
                </View>
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.authColumn, compact && styles.authColumnCompact]}>
        <View style={styles.authCard}>
          <View style={styles.mobileBrand}>
            <Logo tamanho={42} />
            <View>
              <Text style={styles.brand}>GESTÃO<Text style={{ color: C.accentText }}>PRO</Text></Text>
              <Text style={styles.brandSub}>Gestão de obras</Text>
            </View>
          </View>

          <Text style={styles.title}>{isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Cadastre-se para acessar seus projetos de qualquer dispositivo.'
              : 'Entre para acessar seu painel e continuar gerenciando suas obras.'}
          </Text>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={17} color={C.inkMute} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor={C.inkMute}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={17} color={C.inkMute} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo de 6 caracteres"
                  placeholderTextColor={C.inkMute}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={C.accentInk} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {isRegister ? 'Criar conta' : 'Entrar'}
                  </Text>
                  <Feather name="arrow-right" size={17} color={C.accentInk} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {!!message && <Text style={styles.success}>{message}</Text>}

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsRegister((v) => !v)}>
            <Text style={styles.switchText}>
              {isRegister ? 'Já tem uma conta? ' : 'Ainda não tem uma conta? '}
              <Text style={styles.switchStrong}>{isRegister ? 'Entrar' : 'Criar conta'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },
  hero: { flex: 1.1, backgroundColor: C.graphite, position: 'relative', overflow: 'hidden', justifyContent: 'space-between', padding: 48 },
  heroTexto: { maxWidth: 520 },
  heroMarca: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTitle: { fontFamily: F.display, color: C.onGraphite, fontSize: 44, fontWeight: '700', letterSpacing: 1 },
  heroText: { fontFamily: F.body, marginTop: 14, maxWidth: 440, color: C.onGraphiteDim, fontSize: 18, lineHeight: 27 },
  featureList: { gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: F.body, color: C.onGraphite, fontSize: 15, fontWeight: '600' },
  authColumn: { flex: 0.9, alignItems: 'center', justifyContent: 'center', padding: 36 },
  authColumnCompact: { flex: 1, padding: 20 },
  authCard: { width: '100%', maxWidth: 440, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, borderTopWidth: 4, borderTopColor: C.accent, padding: 30, shadowColor: '#1D2024', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 14 } },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 26 },
  brand: { fontFamily: F.display, fontSize: 24, fontWeight: '700', color: C.ink, letterSpacing: 0.6 },
  brandSub: { fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: -1 },
  title: { fontFamily: F.display, fontSize: 34, fontWeight: '700', color: C.ink },
  subtitle: { fontFamily: F.body, color: C.inkSoft, fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
  label: { fontFamily: F.body, fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 7 },
  inputWrap: { height: 48, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, backgroundColor: C.surface2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  input: { flex: 1, color: C.ink, fontSize: 15, fontFamily: F.body, outlineStyle: 'none' } as any,
  primaryButton: { height: 48, marginTop: 4, borderRadius: R.sm, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  primaryButtonText: { fontFamily: F.body, color: C.accentInk, fontWeight: '700', fontSize: 15 },
  success: { fontFamily: F.body, marginTop: 16, color: '#1E6B3D', backgroundColor: C.okSoft, borderWidth: 1, borderColor: '#BFE3CC', padding: 12, borderRadius: R.md, fontSize: 13, lineHeight: 19 },
  switchButton: { marginTop: 22, alignItems: 'center' },
  switchText: { fontFamily: F.body, color: C.inkSoft, fontSize: 14 },
  switchStrong: { color: C.accentText, fontWeight: '700' },
});
