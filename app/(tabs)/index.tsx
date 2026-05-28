import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome5 name="building" size={24} color="#3B5998" />
          <Text style={styles.headerTitle}>Gestor de Obras</Text>
        </View>

        {/* Dashboard Cards Grid */}
        <View style={styles.dashboardGrid}>
          {/* Card 1: Obras Ativas */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardTitle}>Obras Ativas</Text>
            <View style={styles.cardValueContainer}>
              <FontAwesome5 name="building" size={20} color="#3B5998" />
              <Text style={styles.cardValue}>3</Text>
            </View>
          </View>

          {/* Card 2: Obras Atrasadas */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardTitle}>Obras Atrasadas</Text>
            <View style={styles.cardValueContainer}>
              <Feather name="alert-circle" size={20} color="#E02424" />
              <Text style={[styles.cardValue, { color: '#E02424' }]}>1</Text>
            </View>
          </View>

          {/* Card 3: Orçamento Total */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardTitle}>Orçamento Total</Text>
            <View style={styles.cardValueContainer}>
              <Feather name="trending-up" size={20} color="#31C48D" />
              <Text style={styles.cardValue}>R$ 795k</Text>
            </View>
          </View>

          {/* Card 4: Gasto Acumulado */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardTitle}>Gasto Acumulado</Text>
            <View style={styles.cardValueContainer}>
              <Feather name="clock" size={20} color="#D0813B" />
              <Text style={styles.cardValue}>R$ 441k</Text>
            </View>
            <Text style={styles.cardSubtitle}>55% do orçamento</Text>
          </View>
        </View>

        {/* Section Title & Button */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Obras</Text>
          <TouchableOpacity style={styles.newButton} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Nova</Text>
          </TouchableOpacity>
        </View>

        {/* Project Card (Clicável) */}
        <TouchableOpacity
          style={styles.projectCard}
          activeOpacity={0.9}
          onPress={() => router.push('/details')}
        >
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>Casa Residencial - Jardim das Flores</Text>
            <View style={styles.phaseContainer}>
              <Text style={styles.phaseLabel}>Fase Atual</Text>
              <Text style={styles.phaseValue}>Estrutura</Text>
            </View>
          </View>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Em Andamento</Text>
          </View>

          <Text style={styles.clientText}>Cliente: João Silva</Text>
          <Text style={styles.addressText}>Rua das Flores, 123 - Jardim das Flores</Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressPercentage}>45%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '45%' }]} />
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Project Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Início</Text>
              <Text style={styles.detailValue}>14/01/2026</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Previsão</Text>
              <Text style={styles.detailValue}>29/06/2026</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Orçamento</Text>
              <Text style={styles.detailValue}>R$ 280k</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Gasto</Text>
              <Text style={styles.detailValue}>R$ 126k (45%)</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dashboardCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    minHeight: 110,
  },
  cardTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    paddingRight: 10,
  },
  phaseContainer: {
    alignItems: 'flex-end',
  },
  phaseLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  phaseValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badgeContainer: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clientText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#475569',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
});