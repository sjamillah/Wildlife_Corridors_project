import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Colors } from '../../../constants/Colors';
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
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Security Alerts</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{alerts.length} total alerts</Text>
      </View>

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
          <Card key={alert.id}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIconContainer}>
                <Text style={[styles.alertIcon, { color: alert.color }]}>{alert.icon}</Text>
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.timestamp}>{alert.timestamp}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Badge 
                    variant={getStatusBadgeVariant(alert.status)}
                    style={styles.statusBadge}
                  >
                    {alert.status}
                  </Badge>
                </View>

                {alert.active && (
                  <View style={styles.alertActions}>
                    {alert.status !== 'Acknowledged' && (
                      <Button
                        variant="danger"
                        size="small"
                        style={styles.actionButton}
                        onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== 'Snoozed' && (
                      <Button
                        variant="secondary"
                        size="small"
                        style={styles.actionButton}
                        onPress={() => handleAlertAction(alert.id, 'snooze')}
                      >
                        Snooze
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="small"
                      style={styles.actionButton}
                      onPress={() => handleAlertAction(alert.id, 'resolve')}
                    >
                      Resolve
                    </Button>
                  </View>
                )}
              </View>
            </View>
          </Card>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
  },
  activeTabButton: {
    backgroundColor: '#16a34a',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f3f4f6',
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
    color: '#6b7280',
  },
  activePriorityButtonText: {
    color: '#92400e',
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
    color: '#6b7280',
  },
  metaSeparator: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
    textAlign: 'center',
  },
});