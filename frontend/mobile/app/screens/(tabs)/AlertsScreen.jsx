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
import { Card } from '../../../components/ui/Card';
import { LogoHeader } from '../../../components/ui/LogoHeader';
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
  
  const [activeTab, setActiveTab] = useState('Active');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const tabs = ['Active', 'Resolved'];

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
    const matchesTab = activeTab === 'Active' ? alert.active : !alert.active;
    const matchesPriority = selectedPriority === 'All' || alert.priority === selectedPriority;
    return matchesTab && matchesPriority;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <LogoHeader />
      
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
            ]}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab && styles.activeTabButtonText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Priority Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.priorityFilters}>
          <Text style={styles.filterLabel}>Priority:</Text>
          {['All', 'Critical', 'High', 'Medium'].map(priority => (
            <TouchableOpacity
              key={priority}
              onPress={() => setSelectedPriority(priority)}
              style={[
                styles.priorityButton,
                selectedPriority === priority && styles.activePriorityButton,
                selectedPriority === priority && priority === 'Critical' && styles.criticalPriority,
                selectedPriority === priority && priority === 'High' && styles.highPriority,
                selectedPriority === priority && priority === 'Medium' && styles.mediumPriority,
                selectedPriority === priority && priority === 'All' && styles.allPriority,
              ]}
            >
              <Text style={[
                styles.priorityButtonText,
                selectedPriority === priority && styles.activePriorityButtonText
              ]}>
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredAlerts.map((alert) => (
          <TouchableOpacity key={alert.id} activeOpacity={0.9}>
            <Card style={styles.alertCard}>
              <View style={styles.alertCardContent}>
                {/* Left Accent Bar */}
                <View style={[styles.alertAccent, { backgroundColor: alert.color }]} />
                
                {/* Alert Icon */}
                <View style={[styles.alertIconCircle, { backgroundColor: alert.color + '20' }]}>
                  <MaterialCommunityIcons name={alert.icon} size={24} color={alert.color} />
                </View>
                
                {/* Alert Info */}
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertTitleNew, { color: colors.text }]}>{alert.title}</Text>
                  <View style={styles.alertMetaRow}>
                    <Text style={[styles.alertTypeNew, { color: colors.textSecondary }]}>{alert.type}</Text>
                    <Text style={[styles.alertTimestamp, { color: colors.textSecondary }]}>• {alert.timestamp}</Text>
                  </View>
                  <View style={styles.alertLocation}>
                    <MaterialCommunityIcons name="map-marker" size={12} color={colors.textSecondary} />
                    <Text style={[styles.alertLocationText, { color: colors.textSecondary }]}>
                      {alert.location || 'Maasai Mara'} • {alert.distance || '0.8 km'}
                    </Text>
                  </View>
                </View>
                
                {/* Status Badge */}
                <View style={[styles.statusBadgeNew, { 
                  backgroundColor: alert.status === 'Active' ? STATUS_COLORS.ERROR + '20' : 
                                   alert.status === 'Acknowledged' ? STATUS_COLORS.WARNING + '20' : 
                                   STATUS_COLORS.SUCCESS + '20'
                }]}>
                  <Text style={[styles.statusBadgeText, {
                    color: alert.status === 'Active' ? STATUS_COLORS.ERROR : 
                           alert.status === 'Acknowledged' ? STATUS_COLORS.WARNING : 
                           STATUS_COLORS.SUCCESS
                  }]}>{alert.status}</Text>
                </View>
              </View>
              
              {/* Action Buttons */}
              {alert.active && (
                <View style={styles.alertActionsNew}>
                  {alert.status !== 'Acknowledged' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: BRAND_COLORS.PRIMARY }]}
                      onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnText}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                  {alert.status !== 'Resolved' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: STATUS_COLORS.SUCCESS }]}
                      onPress={() => handleAlertAction(alert.id, 'resolve')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnText}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
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
    // backgroundColor will be set dynamically by theme
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BRAND_COLORS.MUTED,
  },
  activeTabButton: {
    backgroundColor: STATUS_COLORS.SUCCESS,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: BRAND_COLORS.SURFACE,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  priorityFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 4,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.MUTED,
  },
  activePriorityButton: {
    backgroundColor: '#fbbf24',
  },
  criticalPriority: {
    backgroundColor: '#fecaca',
  },
  highPriority: {
    backgroundColor: '#fed7aa',
  },
  mediumPriority: {
    backgroundColor: '#dcfce7',
  },
  allPriority: {
    backgroundColor: '#fbbf24',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  activePriorityButtonText: {
    color: '#92400e',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  alertAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  alertTypeNew: {
    fontSize: 12,
    fontWeight: '500',
  },
  alertTimestamp: {
    fontSize: 12,
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  alertLocationText: {
    fontSize: 11,
  },
  statusBadgeNew: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertActionsNew: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  metaSeparator: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginHorizontal: 8,
  },
  timestamp: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    marginRight: 8,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
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
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});