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
          <View style={styles.heroBadge}>
            <Feather name="layers" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>ObraMax Pro</Text>
          <Text style={styles.heroText}>
            Obras, cronogramas, materiais e progresso em um único lugar.
          </Text>

          <View style={styles.featureList}>
            {[
              ['cloud', 'Dados sincronizados na nuvem'],
              ['bar-chart-2', 'Indicadores financeiros e de progresso'],
              ['users', 'Conta individual e dados privados'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Feather name={icon as any} size={17} color="#2563EB" />
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
            <View style={styles.logo}>
              <Feather name="layers" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brand}>ObraMax</Text>
              <Text style={styles.brandSub}>Gestão de Obras</Text>
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
                <Feather name="mail" size={17} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={17} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo de 6 caracteres"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {isRegister ? 'Criar conta' : 'Entrar'}
                  </Text>
                  <Feather name="arrow-right" size={17} color="#FFFFFF" />
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
  page: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  hero: {
    flex: 1.05,
    backgroundColor: '#0F172A',
    paddingHorizontal: 72,
    justifyContent: 'center',
  },
  heroBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  heroText: {
    marginTop: 14,
    maxWidth: 470,
    color: '#CBD5E1',
    fontSize: 18,
    lineHeight: 28,
  },
  featureList: { marginTop: 42, gap: 18 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  authColumn: { flex: 0.95, alignItems: 'center', justifyContent: 'center', padding: 36 },
  authColumnCompact: { flex: 1, padding: 20 },
  authCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 30 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  brandSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 26 },
  form: { gap: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 7 },
  inputWrap: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 9,
  },
  input: { flex: 1, color: '#0F172A', fontSize: 14, outlineStyle: 'none' } as any,
  primaryButton: {
    height: 48,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  success: {
    marginTop: 16,
    color: '#166534',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  switchButton: { marginTop: 22, alignItems: 'center' },
  switchText: { color: '#64748B', fontSize: 13 },
  switchStrong: { color: '#2563EB', fontWeight: '800' },
});
