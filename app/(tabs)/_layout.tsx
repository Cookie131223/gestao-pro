import { Feather } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { session, logout } = useAuth();

  const desktop = width >= 900;
  const selected = (route: string) => pathname === route;

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
              <View style={styles.blueIconBox}>
                <Feather name="layers" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.brandName}>ObraMax</Text>
                <Text style={styles.brandSub}>Gestão de Obras</Text>
              </View>
            </View>

            <View style={styles.navGroup}>
              <TouchableOpacity
                style={[styles.navItem, selected('/') && styles.navItemActive]}
                onPress={() => router.push('/')}
              >
                <Feather name="grid" size={19} color={selected('/') ? '#2563EB' : '#64748B'} />
                <Text style={[styles.navText, selected('/') && styles.navTextActive]}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, selected('/explore') && styles.navItemActive]}
                onPress={() => router.push('/explore')}
              >
                <Feather name="calendar" size={19} color={selected('/explore') ? '#2563EB' : '#64748B'} />
                <Text style={[styles.navText, selected('/explore') && styles.navTextActive]}>Cronograma</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.accountBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(session?.user.email?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountLabel}>Conta conectada</Text>
              <Text style={styles.accountEmail} numberOfLines={1}>{session?.user.email}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Feather name="log-out" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.contentArea}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: desktop
              ? { display: 'none' }
              : {
                  height: 66,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderTopColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Cronograma',
              tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
            }}
          />
          <Tabs.Screen name="details" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  windowWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  sidebar: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 18,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 12,
    marginBottom: 30,
  },
  blueIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 21, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  brandSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  navGroup: { gap: 7 },
  navItem: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  navItemActive: { backgroundColor: '#EFF6FF' },
  navText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  navTextActive: { color: '#2563EB', fontWeight: '800' },
  accountBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1D4ED8', fontWeight: '800' },
  accountText: { flex: 1, minWidth: 0 },
  accountLabel: { color: '#94A3B8', fontSize: 10 },
  accountEmail: { color: '#334155', fontSize: 11, fontWeight: '700', marginTop: 2 },
  logoutButton: { padding: 8 },
  contentArea: { flex: 1, minWidth: 0 },
});
