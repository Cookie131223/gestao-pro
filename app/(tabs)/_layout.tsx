import { Feather } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import Logo from '../../components/marca/Logo';
import { C, F, iniciais } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';
import { useObras } from '../../context/ObraContext';

const NAV = [
  { rota: '/', nome: 'Painel', icone: 'grid' },
  { rota: '/explore', nome: 'Cronograma', icone: 'calendar' },
  { rota: '/tasks', nome: 'Tarefas', icone: 'columns' },
] as const;

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { session, logout } = useAuth();
  const { obras, syncing, syncError } = useObras();

  const desktop = width >= 900;
  const selected = (route: string) => pathname === route || (route === '/' && pathname === '/details');
  const atrasadas = obras.filter((o) => o.status === 'Atrasada').length;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <View style={styles.windowWrapper}>
      {desktop && (
        <View style={styles.sidebar}>
          <View>
            <View style={styles.logoContainer}>
              <Logo tamanho={42} />
              <View>
                <Text style={styles.brandName}>GESTÃO<Text style={{ color: C.accent }}>PRO</Text></Text>
                <Text style={styles.brandSub}>Gestão de obras</Text>
              </View>
            </View>

            <Text style={styles.navTitulo}>MENU</Text>
            <View style={styles.navGroup}>
              {NAV.map((item) => {
                const ativo = selected(item.rota);
                return (
                  <TouchableOpacity
                    key={item.rota}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    style={[styles.navItem, ativo && styles.navItemActive]}
                    onPress={() => router.push(item.rota)}
                  >
                    {ativo && <View style={styles.navMarca} />}
                    <Feather name={item.icone} size={18} color={ativo ? C.accent : C.onGraphiteDim} />
                    <Text style={[styles.navText, ativo && styles.navTextActive]}>{item.nome}</Text>
                    {item.rota === '/' && atrasadas > 0 && (
                      <View style={styles.navAlerta}><Text style={styles.navAlertaTxt}>{atrasadas}</Text></View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity accessibilityRole="button" style={styles.novaObra} onPress={() => router.push('/modal')}>
              <Feather name="plus" size={17} color={C.accentInk} />
              <Text style={styles.novaObraTxt}>Nova obra</Text>
            </TouchableOpacity>
          </View>

          <View>
            <View style={styles.syncLinha}>
              <View style={[styles.syncPonto, { backgroundColor: syncError ? C.bad : syncing ? C.accent : C.ok }]} />
              <Text style={styles.syncTxt}>{syncError ? 'Sincronização pendente' : syncing ? 'Sincronizando…' : 'Dados na nuvem'}</Text>
            </View>
            <View style={styles.accountBox}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{iniciais(session?.user.email?.split('@')[0])}</Text>
              </View>
              <View style={styles.accountText}>
                <Text style={styles.accountLabel}>Conta conectada</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>{session?.user.email}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sair da conta" style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={18} color={C.onGraphiteDim} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.contentArea}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: C.bg },
            tabBarActiveTintColor: C.accent,
            tabBarInactiveTintColor: C.onGraphiteDim,
            tabBarStyle: desktop
              ? { display: 'none' }
              : {
                  height: 66,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderTopWidth: 0,
                  backgroundColor: C.graphite,
                },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700', fontFamily: F.body, letterSpacing: 0.3 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Painel · GestãoPro',
              tabBarLabel: 'Painel',
              tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Cronograma · GestãoPro',
              tabBarLabel: 'Cronograma',
              tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
            }}
          />
          <Tabs.Screen name="tasks" options={{ title: 'Tarefas · GestãoPro', tabBarLabel: 'Tarefas', tabBarIcon: ({ color }) => <Feather name="columns" size={20} color={color} /> }} />
          <Tabs.Screen name="details" options={{ href: null, title: 'Obra · GestãoPro' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  windowWrapper: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },
  sidebar: {
    width: 256,
    backgroundColor: C.graphite,
    padding: 18,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 10,
    marginBottom: 26,
  },
  brandName: { fontFamily: F.display, fontSize: 24, fontWeight: '700', color: C.onGraphite, letterSpacing: 0.6 },
  brandSub: { fontFamily: F.body, fontSize: 12, color: C.onGraphiteDim, marginTop: -1 },
  navTitulo: { fontFamily: F.body, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: C.onGraphiteDim, marginBottom: 8, paddingHorizontal: 12, opacity: 0.7 },
  navGroup: { gap: 4 },
  navItem: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  navItemActive: { backgroundColor: C.graphite2 },
  navMarca: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: C.accent },
  navText: { fontFamily: F.body, color: C.onGraphiteDim, fontWeight: '600', fontSize: 15, flex: 1 },
  navTextActive: { color: C.onGraphite },
  navAlerta: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.bad, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navAlertaTxt: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: F.body },
  novaObra: { marginTop: 22, height: 44, borderRadius: 8, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  novaObraTxt: { fontFamily: F.body, fontWeight: '700', fontSize: 14, color: C.accentInk, letterSpacing: 0.2 },
  syncLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, marginBottom: 12 },
  syncPonto: { width: 8, height: 8, borderRadius: 4 },
  syncTxt: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 12 },
  accountBox: {
    borderTopWidth: 1,
    borderTopColor: C.graphite3,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.graphite3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.display, color: C.accent, fontWeight: '700', fontSize: 16 },
  accountText: { flex: 1, minWidth: 0 },
  accountLabel: { fontFamily: F.body, color: C.onGraphiteDim, fontSize: 11 },
  accountEmail: { fontFamily: F.body, color: C.onGraphite, fontSize: 12, fontWeight: '600', marginTop: 1 },
  logoutButton: { padding: 8 },
  contentArea: { flex: 1, minWidth: 0 },
});
