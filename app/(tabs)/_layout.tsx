// app/(tabs)/_layout.tsx
import { Feather } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const isSelected = (route: string) => pathname === route;

  return (
    <View style={styles.windowWrapper}>
      
      {/* 🟦 BARRA LATERAL FIEL AO FIGMA */}
      <View style={styles.sidebar}>
        
        {/* Topo: Logo e Título */}
        <View style={styles.logoContainer}>
          <View style={styles.blueIconBox}>
            <Feather name="layers" size={24} color="#FFF" />
          </View>
          <View style={styles.logoTextGroup}>
            <Text style={styles.brandName}>ObraMax</Text>
            <Text style={styles.brandSub}>Gestão de Obras</Text>
          </View>
        </View>

        {/* Links de Navegação Vertical */}
        <View style={styles.navGroup}>
          <TouchableOpacity 
            style={[styles.navItem, isSelected('/(tabs)') && styles.navItemActive]}
            onPress={() => router.push('/(tabs)')}
          >
            <Feather name="home" size={20} color={isSelected('/(tabs)') ? '#3B82F6' : '#475569'} />
            <Text style={[styles.navText, isSelected('/(tabs)') && styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, isSelected('/explore') && styles.navItemActive]}
            onPress={() => router.push('/explore')}
          >
            <Feather name="clipboard" size={20} color={isSelected('/explore') ? '#3B82F6' : '#475569'} />
            <Text style={[styles.navText, isSelected('/explore') && styles.navTextActive]}>Cronograma Geral</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé: Powered By */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Powered by</Text>
          <Text style={styles.footerBrand}>ObraMax Pro</Text>
        </View>
      </View>

      {/* 🖥️ CONTAINER DO CONTEÚDO */}
      <View style={styles.contentArea}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, 
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
          <Tabs.Screen name="explore" options={{ title: 'Cronograma' }} />
          <Tabs.Screen name="details" options={{ href: null }} />
        </Tabs>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  windowWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  sidebar: { width: 260, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderColor: '#E2E8F0', paddingTop: 32, paddingHorizontal: 16, justifyContent: 'space-between', height: '100%' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8 },
  blueIconBox: { width: 44, height: 44, backgroundColor: '#3B82F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logoTextGroup: { marginLeft: 12 },
  brandName: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  brandSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  navGroup: { flex: 1, gap: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 12 },
  navItemActive: { backgroundColor: '#EFF6FF' },
  navText: { fontSize: 15, fontWeight: '500', color: '#475569' },
  navTextActive: { color: '#3B82F6', fontWeight: 'bold' },
  footerContainer: { alignItems: 'center', paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  footerText: { fontSize: 12, color: '#94A3B8' },
  footerBrand: { fontSize: 13, fontWeight: 'bold', color: '#3B82F6', marginTop: 2 },
  contentArea: { flex: 1 },
});