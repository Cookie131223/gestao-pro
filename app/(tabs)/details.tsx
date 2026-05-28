import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="building" size={20} color="#3B5998" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Casa Residencial - Jardim das Flores</Text>
          </View>
          
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Em Andamento</Text>
          </View>
        </View>

        {/* Top Cards Grid */}
        <View style={styles.topCardsGrid}>
          {/* Cliente */}
          <View style={styles.topCard}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={16} color="#64748B" />
              <Text style={styles.cardLabel}>Cliente</Text>
            </View>
            <Text style={styles.cardValue}>João Silva</Text>
          </View>

          {/* Localização */}
          <View style={styles.topCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.cardLabel}>Localização</Text>
            </View>
            <Text style={styles.cardValue}>Rua das Flores, 123 - Jardim das Flores</Text>
          </View>

          {/* Prazo */}
          <View style={styles.topCard}>
            <View style={styles.cardHeader}>
              <Feather name="calendar" size={16} color="#64748B" />
              <Text style={styles.cardLabel}>Prazo</Text>
            </View>
            <Text style={styles.cardValue}>91 dias restantes</Text>
            <Text style={styles.cardSubtitle}>74 dias decorridos</Text>
          </View>

          {/* Progresso */}
          <View style={styles.topCard}>
            <View style={styles.cardHeader}>
              <Feather name="trending-up" size={16} color="#64748B" />
              <Text style={styles.cardLabel}>Progresso</Text>
            </View>
            <Text style={styles.progressValue}>45%</Text>
          </View>
        </View>

        {/* Visão Financeira Section */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={18} color="#31C48D" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Visão Financeira</Text>
          </View>

          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Orçamento Total</Text>
            <Text style={styles.financeValue}>R$ 280.000</Text>
          </View>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Valor Gasto</Text>
            <Text style={[styles.financeValue, {color: '#3B82F6'}]}>R$ 126.000</Text>
          </View>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Saldo Disponível</Text>
            <Text style={[styles.financeValue, {color: '#31C48D'}]}>R$ 154.000</Text>
          </View>

          {/* Finance Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '45%' }]} />
            </View>
            <Text style={styles.progressPercentageText}>45.0% do orçamento utilizado</Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="cube-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Gerenciar Materiais</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="images-outline" size={18} color="#1E293B" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Ver Fotos da Obra</Text>
          </TouchableOpacity>
        </View>

        {/* Cronograma da Obra Section */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={18} color="#64748B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Cronograma da Obra</Text>
          </View>

          {/* Timeline Items */}
          {[
            { name: 'Fundação', date: 'Jan 2026', status: 'Concluída' },
            { name: 'Estrutura', date: 'Mar 2026', status: 'Em Andamento' },
            { name: 'Alvenaria', date: 'Abr 2026', status: 'Pendente' },
            { name: 'Instalações', date: 'Mai 2026', status: 'Pendente' },
            { name: 'Acabamento', date: 'Jun 2026', status: 'Pendente' },
          ].map((item) => (
            <View key={item.name} style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                {item.status === 'Concluída' && <Ionicons name="checkmark-circle" size={24} color="#31C48D" />}
                {item.status === 'Em Andamento' && <FontAwesome5 name="adjust" size={24} color="#3B82F6" />}
                {item.status === 'Pendente' && <View style={styles.pendingPoint} />}
              </View>
              
              <View style={styles.timelineContent}>
                <Text style={styles.timelineName}>{item.name}</Text>
                <Text style={styles.timelineDate}>{item.date}</Text>
              </View>

              <View style={[styles.statusBadge, {
                backgroundColor: item.status === 'Concluída' ? '#EBF5FF' : (item.status === 'Em Andamento' ? '#E1EFFF' : '#F1F5F9')
              }]}>
                <Text style={[styles.statusBadgeText, {
                  color: item.status === 'Concluída' ? '#3B82F6' : (item.status === 'Em Andamento' ? '#3B82F6' : '#64748B')
                }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Detalhes do Progresso Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitleNoIcon}>Detalhes do Progresso</Text>
          
          <Text style={styles.phaseTitle}>Fase Atual: Estrutura</Text>

          {/* Main Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '45%' }]} />
            </View>
            <Text style={styles.progressPercentageTextBottom}>45% Concluído</Text>
          </View>

          {/* Date Details */}
          <View style={styles.dateDetails}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Data de Início</Text>
              <Text style={styles.dateValue}>14 de janeiro de 2026</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Previsão de Término</Text>
              <Text style={styles.dateValue}>29 de junho de 2026</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Duração Total</Text>
              <Text style={styles.dateValue}>166 dias</Text>
            </View>
          </View>
        </View>

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
  backButton: {
    paddingRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flexShrink: 1,
  },
  badgeContainer: {
    backgroundColor: '#3B82F6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  topCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionTitleNoIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
  },
  financeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  financeLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  financeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressSection: {
    marginTop: 16,
    marginBottom: 20,
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
  progressPercentageText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'left',
  },
  progressPercentageTextBottom: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelinePoint: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pendingPoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  timelineContent: {
    flex: 1,
  },
  timelineName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  dateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  dateItem: {
    width: '48%',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
});