import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const screenWidth = Dimensions.get('window').width;
  
  const [alertCounts] = useState({
    Critical: 2,
    High: 1,
    Medium: 1
  });

  const handleViewAlerts = () => {
    router.push('/screens/(tabs)/AlertsScreen');
  };

  // Professional header component
  const renderHeader = () => (
    <View style={[styles.header, { 
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBackground || colors.surface
    }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Wildlife Corridor Monitor
      </Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary || colors.icon }]}>
        Dashboard Overview
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alerts Summary */}
        <Card variant="elevated">
          <Text style={[styles.cardTitle, { color: colors.text }]}>Critical Alerts</Text>
          <View style={styles.alertsGrid}>
            <View style={[styles.alertCard, styles.criticalAlert]}>
              <Text style={styles.alertNumber}>{alertCounts.Critical}</Text>
              <Text style={styles.alertType}>Critical</Text>
            </View>
            <View style={[styles.alertCard, styles.highAlert]}>
              <Text style={styles.alertNumber}>{alertCounts.High}</Text>
              <Text style={styles.alertType}>High</Text>
            </View>
            <View style={[styles.alertCard, styles.mediumAlert]}>
              <Text style={styles.alertNumber}>{alertCounts.Medium}</Text>
              <Text style={styles.alertType}>Medium</Text>
            </View>
          </View>
          <Button 
            onPress={handleViewAlerts}
            variant="primary"
            size="medium"
            fullWidth={screenWidth < 400}
          >
            View All Alerts
          </Button>
        </Card>

        {/* System Status */}
        <Card variant="outlined">
          <Text style={[styles.cardTitle, { color: colors.text }]}>System Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: colors.accent.success }]}>
                <Text style={styles.statusIconText}>📡</Text>
              </View>
              <Text style={[styles.statusLabel, { color: colors.text }]}>GPS</Text>
              <Text style={[styles.statusValue, { color: colors.accent.success }]}>Active</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: colors.accent.success }]}>
                <Text style={styles.statusIconText}>🔋</Text>
              </View>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Battery</Text>
              <Text style={[styles.statusValue, { color: colors.accent.success }]}>85%</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: colors.accent.secondary }]}>
                <Text style={styles.statusIconText}>🔄</Text>
              </View>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Sync</Text>
              <Text style={[styles.statusValue, { color: colors.icon }]}>08:24 AM</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Button 
              variant="primary"
              size="large"
              style={styles.actionButton}
              onPress={() => router.push('/screens/(tabs)/MapScreen')}
            >
              🗺️ Open Map
            </Button>
            <Button 
              variant="success"
              size="large"
              style={styles.actionButton}
              onPress={() => router.push('/screens/(tabs)/FieldDataScreen')}
            >
              📝 Log Data
            </Button>
          </View>
          <View style={styles.secondaryActions}>
            <Button 
              variant="secondary"
              size="medium"
              fullWidth
              onPress={() => router.push('/screens/(tabs)/AlertsScreen')}
            >
              📢 Emergency Alert
            </Button>
          </View>
        </Card>

        <Button style={styles.fullWidthButton}>
          Refresh Status
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for tab bar
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  alertsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  alertCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  criticalAlert: {
    backgroundColor: '#fee2e2',
  },
  highAlert: {
    backgroundColor: '#fed7aa',
  },
  mediumAlert: {
    backgroundColor: '#fef3c7',
  },
  alertNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconText: {
    fontSize: 18,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  secondaryActions: {
    marginTop: 8,
  },
});
