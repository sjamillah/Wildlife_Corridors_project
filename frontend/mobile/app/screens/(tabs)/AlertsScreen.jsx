import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAlerts } from '../../../contexts/AlertsContext';

export default function AlertsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { 
    alerts, 
    acknowledgeAlert, 
    snoozeAlert, 
    resolveAlert 
  } = useAlerts();
  
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Active', 'Resolved'];

  const handleAlertAction = (alertId, action) => {
    switch (action) {
      case 'acknowledge':
        acknowledgeAlert(alertId);
        break;
      case 'snooze':
        snoozeAlert(alertId);
        break;
      case 'resolve':
        resolveAlert(alertId);
        break;
      default:
        break;
    }
  };



  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'New':
        return 'warning';
      case 'Acknowledged':
        return 'info';
      case 'Snoozed':
        return 'purple';
      case 'Resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return alert.active;
    if (activeTab === 'Resolved') return !alert.active;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/screens/(tabs)/DashboardScreen')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={BRAND_COLORS.SURFACE} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Alerts</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Simple Filter Tabs */}
      <View style={styles.filterTabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.filterTab,
              activeTab === tab && styles.activeFilterTab
            ]}
          >
            <Text style={[
              styles.filterTabText,
              activeTab === tab && styles.activeFilterTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredAlerts.map((alert) => (
          <View 
            key={alert.id}
            style={[styles.alertCard, { 
              backgroundColor: BRAND_COLORS.SURFACE,
              borderLeftColor: alert.color
            }]}
          >
            <View style={styles.cardContent}>
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={[styles.alertTitle, { color: BRAND_COLORS.TEXT }]}>{alert.title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.alertType, { color: BRAND_COLORS.TEXT_SECONDARY }]}>{alert.type}</Text>
                    <Text style={[styles.metaSeparator, { color: BRAND_COLORS.TEXT_TERTIARY }]}>•</Text>
                    <Text style={[styles.alertTimestamp, { color: BRAND_COLORS.TEXT_SECONDARY }]}>{alert.timestamp}</Text>
                  </View>
                </View>
                
                {/* Priority Badge */}
                <View style={[styles.priorityBadge, { 
                  backgroundColor: alert.color + '15',
                  borderColor: alert.color
                }]}>
                  <Text style={[styles.priorityText, { color: alert.color }]}>
                    {alert.priority}
                  </Text>
                </View>
              </View>
              
              {/* Location */}
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color={BRAND_COLORS.TEXT_SECONDARY} />
                <Text style={[styles.locationText, { color: BRAND_COLORS.TEXT_SECONDARY }]}>
                  {alert.location || 'Maasai Mara Reserve'}
                </Text>
              </View>
              
              {/* Status and Actions Row */}
              {alert.active && (
                <View style={styles.actionsRow}>
                  <View style={[styles.statusIndicator, { 
                    backgroundColor: alert.status === 'Active' ? BRAND_COLORS.TERRA_COTTA + '20' : STATUS_COLORS.INFO + '15'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: alert.status === 'Active' ? BRAND_COLORS.TERRA_COTTA : STATUS_COLORS.INFO
                    }]}>
                      {alert.status}
                    </Text>
                  </View>
                  
                  <View style={styles.actionButtonsRow}>
                    {alert.status !== 'Acknowledged' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: BRAND_COLORS.ACCENT }]}
                        onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: BRAND_COLORS.ACCENT }]}>Acknowledge</Text>
                      </TouchableOpacity>
                    )}
                    {alert.status !== 'Resolved' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: STATUS_COLORS.SUCCESS }]}
                        onPress={() => handleAlertAction(alert.id, 'resolve')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: STATUS_COLORS.SUCCESS }]}>Resolve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              
              {!alert.active && (
                <View style={styles.resolvedBadge}>
                  <Text style={styles.resolvedText}>✓ Resolved</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} alerts</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: BRAND_COLORS.SURFACE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  activeFilterTab: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  activeFilterTabText: {
    color: BRAND_COLORS.SURFACE,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  alertCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
    borderRightColor: BRAND_COLORS.BORDER_LIGHT,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertType: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertTimestamp: {
    fontSize: 13,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    backgroundColor: BRAND_COLORS.SURFACE,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  resolvedBadge: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'flex-start',
  },
  resolvedText: {
    fontSize: 13,
    fontWeight: '700',
    color: STATUS_COLORS.SUCCESS,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
  },
});