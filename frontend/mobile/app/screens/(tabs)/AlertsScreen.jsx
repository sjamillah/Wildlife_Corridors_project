import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { useTheme } from '@contexts/ThemeContext';
import { alerts as alertsService } from '@services';
import { safeNavigate } from '@utils';

export default function AlertsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertsService.getAll();
      const alertsArray = Array.isArray(data) ? data : (data.results || []);
      
      // Group alerts by animal + alert type, keeping only the most recent one
      const alertsByAnimalAndType = new Map();
      
      // Process all alerts and keep only the most recent for each animal + type combination
      alertsArray.forEach(alert => {
        const animalId = alert.animal_id || alert.animal || 'unknown';
        const alertType = alert.alert_type || alert.type || 'general';
        const key = `${animalId}-${alertType}`;
        
        const alertTimestamp = new Date(alert.detected_at || alert.timestamp || alert.created_at || 0);
        
        // If we haven't seen this animal+type combo, or this alert is newer, keep it
        const existing = alertsByAnimalAndType.get(key);
        if (!existing || alertTimestamp > new Date(existing.detected_at || existing.timestamp || existing.created_at || 0)) {
        const timestamp = alert.detected_at || alert.timestamp || alert.created_at || new Date().toISOString();
        const timeAgo = getTimeAgo(timestamp);
        
          alertsByAnimalAndType.set(key, {
            id: alert.id || `ALT-${animalId}-${timestamp}`,
          title: alert.title || 'Wildlife Alert',
            type: alertType,
          message: alert.message || alert.description || '',
          location: alert.latitude && alert.longitude ? 
            `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}` : 
            (alert.conflict_zone_name || 'Unknown Location'),
          timestamp: timeAgo,
          priority: alert.severity || 'medium',
          status: alert.status || 'New',
          active: alert.status !== 'resolved' && alert.status !== 'closed',
          color: alert.severity === 'critical' ? STATUS_COLORS.ERROR :
                 alert.severity === 'high' ? BRAND_COLORS.TERRA_COTTA :
                 alert.severity === 'low' ? STATUS_COLORS.SUCCESS : STATUS_COLORS.WARNING,
            detected_at: timestamp, // Keep original timestamp for sorting
      });
        }
      });
      
      // Convert Map to Array and sort by most recent first
      const transformedAlerts = Array.from(alertsByAnimalAndType.values())
        .sort((a, b) => {
          const timeA = new Date(a.detected_at || 0);
          const timeB = new Date(b.detected_at || 0);
          return timeB - timeA; // Most recent first
        });
      console.log('AlertsScreen: Loaded', transformedAlerts.length, 'alerts (deduplicated)');
      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    let mounted = true;
    let intervalId = null;
    
    const loadAlerts = async () => {
      if (!mounted) return;
      try {
        await fetchAlerts();
      } catch (error) {
        console.error('Error in alert refresh:', error);
        // Don't crash - just log the error
      }
    };
    
    // Initial load
    loadAlerts();
    
    // Refresh every 30 seconds (but only if component is still mounted)
    intervalId = setInterval(() => {
      if (mounted) {
        loadAlerts();
      }
    }, 30000);
    
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [fetchAlerts]);
  
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  const [actionLoading, setActionLoading] = useState(null); // Track which alert action is loading
  
  const handleAlertAction = async (alertId, action) => {
    // Prevent double-clicks
    if (actionLoading === alertId) {
      console.log('Action already in progress for alert:', alertId);
      return;
    }
    
    try {
      console.log(`🔄 Handling alert action: ${action} for alert ${alertId}`);
      
      // Set loading state for this specific alert
      setActionLoading(alertId);
      
      let result;
      switch (action) {
        case 'acknowledge':
          result = await Promise.race([
            alertsService.acknowledge(alertId),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Acknowledge timeout')), 30000)
            )
          ]);
          console.log('✅ Alert acknowledged:', result);
          break;
        case 'resolve':
          result = await Promise.race([
            alertsService.resolve(alertId),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Resolve timeout')), 30000)
            )
          ]);
          console.log('✅ Alert resolved:', result);
          break;
        default:
          console.warn('Unknown action:', action);
          setActionLoading(null);
          return;
      }
      
      // Refresh alerts after successful action
      try {
        await fetchAlerts();
      } catch (refreshError) {
        console.error('Failed to refresh alerts:', refreshError);
        // Don't show error - action was successful
      }
      
      // Show success message
      Alert.alert(
        'Success',
        `Alert ${action === 'acknowledge' ? 'acknowledged' : 'resolved'} successfully.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Failed to update alert:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail ||
                          error.message || 
                          'Unknown error occurred';
      
      // Show user-friendly error
      Alert.alert(
        'Action Failed',
        `Failed to ${action} alert: ${errorMessage}\n\nPlease check your connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      // Always clear loading state
      setActionLoading(null);
    }
  };

  const tabs = ['All', 'Active', 'Resolved'];

  // Calculate counts based on actual alerts data
  const alertCounts = {
    All: alerts.length,
    Active: alerts.filter(alert => alert.active).length,
    New: alerts.filter(alert => alert.status === 'New' && alert.active).length,
    Acknowledged: alerts.filter(alert => alert.status === 'Acknowledged' && alert.active).length,
    Snoozed: alerts.filter(alert => alert.status === 'Snoozed' && alert.active).length,
    Resolved: alerts.filter(alert => !alert.active || alert.status === 'Resolved').length,
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
          onPress={() => safeNavigate('/screens/(tabs)/DashboardScreen')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={BRAND_COLORS.SURFACE} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Alerts</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Status Count Chips */}
      <View style={styles.statusChipsContainer}>
        <View style={styles.statusChipsRow}>
          <View style={[styles.statusChip, { backgroundColor: BRAND_COLORS.TERRA_COTTA + '20' }]}>
            <Text style={[styles.statusChipNumber, { color: BRAND_COLORS.TERRA_COTTA }]}>
              {alertCounts.Active}
            </Text>
            <Text style={[styles.statusChipLabel, { color: BRAND_COLORS.TERRA_COTTA }]}>
              Active
            </Text>
          </View>
          
          <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS.WARNING + '20' }]}>
            <Text style={[styles.statusChipNumber, { color: STATUS_COLORS.WARNING }]}>
              {alertCounts.New}
            </Text>
            <Text style={[styles.statusChipLabel, { color: STATUS_COLORS.WARNING }]}>
              New
            </Text>
          </View>
          
          <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS.INFO + '20' }]}>
            <Text style={[styles.statusChipNumber, { color: STATUS_COLORS.INFO }]}>
              {alertCounts.Acknowledged}
            </Text>
            <Text style={[styles.statusChipLabel, { color: STATUS_COLORS.INFO }]}>
              Acknowledged
            </Text>
          </View>
          
          <View style={[styles.statusChip, { backgroundColor: '#9333EA20' }]}>
            <Text style={[styles.statusChipNumber, { color: '#9333EA' }]}>
              {alertCounts.Snoozed}
            </Text>
            <Text style={[styles.statusChipLabel, { color: '#9333EA' }]}>
              Snoozed
            </Text>
          </View>
          
          <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS.SUCCESS + '20' }]}>
            <Text style={[styles.statusChipNumber, { color: STATUS_COLORS.SUCCESS }]}>
              {alertCounts.Resolved}
            </Text>
            <Text style={[styles.statusChipLabel, { color: STATUS_COLORS.SUCCESS }]}>
              Resolved
            </Text>
          </View>
        </View>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY} />
            <Text style={[styles.loadingText, { color: BRAND_COLORS.TEXT_SECONDARY }]}>
              Loading alerts...
            </Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={48} color={BRAND_COLORS.TEXT_SECONDARY} />
            <Text style={[styles.emptyText, { color: BRAND_COLORS.TEXT_SECONDARY }]}>
              No alerts found
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
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
                    backgroundColor: 
                      alert.status === 'New' ? STATUS_COLORS.WARNING + '20' :
                      alert.status === 'Acknowledged' ? STATUS_COLORS.INFO + '20' :
                      alert.status === 'Snoozed' ? '#9333EA20' :
                      BRAND_COLORS.TERRA_COTTA + '20'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: 
                        alert.status === 'New' ? STATUS_COLORS.WARNING :
                        alert.status === 'Acknowledged' ? STATUS_COLORS.INFO :
                        alert.status === 'Snoozed' ? '#9333EA' :
                        BRAND_COLORS.TERRA_COTTA
                    }]}>
                      {alert.status}
                    </Text>
                  </View>
                  
                  <View style={styles.actionButtonsRow}>
                    {alert.status !== 'Acknowledged' && alert.status !== 'Snoozed' && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn, 
                          { borderColor: BRAND_COLORS.ACCENT },
                          actionLoading === alert.id && styles.actionBtnDisabled
                        ]}
                        onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                        disabled={actionLoading === alert.id || loading}
                        activeOpacity={0.7}
                      >
                        {actionLoading === alert.id ? (
                          <ActivityIndicator size="small" color={BRAND_COLORS.ACCENT} />
                        ) : (
                          <Text style={[styles.actionBtnText, { color: BRAND_COLORS.ACCENT }]}>Acknowledge</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {alert.status === 'Snoozed' && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn, 
                          { borderColor: '#9333EA' },
                          actionLoading === alert.id && styles.actionBtnDisabled
                        ]}
                        onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                        disabled={actionLoading === alert.id || loading}
                        activeOpacity={0.7}
                      >
                        {actionLoading === alert.id ? (
                          <ActivityIndicator size="small" color="#9333EA" />
                        ) : (
                          <Text style={[styles.actionBtnText, { color: '#9333EA' }]}>Unsnooze</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {alert.status !== 'Resolved' && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn, 
                          { borderColor: STATUS_COLORS.SUCCESS },
                          actionLoading === alert.id && styles.actionBtnDisabled
                        ]}
                        onPress={() => handleAlertAction(alert.id, 'resolve')}
                        disabled={actionLoading === alert.id || loading}
                        activeOpacity={0.7}
                      >
                        {actionLoading === alert.id ? (
                          <ActivityIndicator size="small" color={STATUS_COLORS.SUCCESS} />
                        ) : (
                          <Text style={[styles.actionBtnText, { color: STATUS_COLORS.SUCCESS }]}>Resolve</Text>
                        )}
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
        ))
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
  statusChipsContainer: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusChip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    backgroundColor: BRAND_COLORS.SURFACE,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  actionBtnDisabled: {
    opacity: 0.6,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});