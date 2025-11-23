import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';

const DeviceDetailsModal = ({ device, onClose }) => {
  if (!device) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return STATUS_COLORS.SUCCESS;
      case 'Warning': return STATUS_COLORS.WARNING;
      case 'Critical': return STATUS_COLORS.ERROR;
      case 'Low Battery': return STATUS_COLORS.WARNING;
      default: return BRAND_COLORS.TEXT_SECONDARY;
    }
  };

  const getBatteryColor = (battery) => {
    if (battery > 70) return STATUS_COLORS.SUCCESS;
    if (battery > 30) return STATUS_COLORS.WARNING;
    return STATUS_COLORS.ERROR;
  };

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const statusColor = getStatusColor(device.status);
  const batteryColor = getBatteryColor(device.battery);

  return (
    <Modal
      visible={!!device}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: BRAND_COLORS.PRIMARY }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="wifi" size={32} color="white" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceId}>{device.deviceId}</Text>
                  {device.category === 'animal' && device.species && (
                    <Text style={styles.deviceSubtext}>{device.species}</Text>
                  )}
                  {device.category === 'ranger' && device.team && (
                    <Text style={styles.deviceSubtext}>Team: {device.team}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={styles.statusBadgeText}>{device.status}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: STATUS_COLORS.SUCCESS + '15' }]}>
                <MaterialCommunityIcons name="battery" size={24} color={batteryColor} />
                <Text style={[styles.statValue, { color: batteryColor }]}>
                  {Math.round(device.battery)}%
                </Text>
                <Text style={styles.statLabel}>Battery</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: STATUS_COLORS.INFO + '15' }]}>
                <MaterialCommunityIcons name="signal" size={24} color={STATUS_COLORS.INFO} />
                <Text style={[styles.statValue, { color: STATUS_COLORS.INFO }]}>
                  {Math.round(device.signalStrength)}%
                </Text>
                <Text style={styles.statLabel}>Signal</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: BRAND_COLORS.PRIMARY + '15' }]}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={BRAND_COLORS.PRIMARY} />
                <Text style={[styles.statValue, { color: BRAND_COLORS.PRIMARY }]}>
                  {formatTimeSince(device.lastPing)}
                </Text>
                <Text style={styles.statLabel}>Last Ping</Text>
              </View>

              {device.category === 'animal' && device.speed !== undefined && (
                <View style={[styles.statCard, { backgroundColor: STATUS_COLORS.WARNING + '15' }]}>
                  <MaterialCommunityIcons name="speedometer" size={24} color={STATUS_COLORS.WARNING} />
                  <Text style={[styles.statValue, { color: STATUS_COLORS.WARNING }]}>
                    {device.speed?.toFixed(1) || '0.0'} km/h
                  </Text>
                  <Text style={styles.statLabel}>Speed</Text>
                </View>
              )}
            </View>

            {/* Device Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Device Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Device Type:</Text>
                  <Text style={styles.infoValue}>{device.type || 'GPS Tracking Device'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category:</Text>
                  <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                    {device.category}
                  </Text>
                </View>
                {device.category === 'animal' && device.activity && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Activity:</Text>
                    <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                      {device.activity}
                    </Text>
                  </View>
                )}
                {device.category === 'animal' && device.riskLevel && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Risk Level:</Text>
                    <Text style={[
                      styles.infoValue,
                      { 
                        color: device.riskLevel === 'critical' || device.riskLevel === 'high' 
                          ? STATUS_COLORS.ERROR 
                          : STATUS_COLORS.WARNING,
                        textTransform: 'capitalize'
                      }
                    ]}>
                      {device.riskLevel}
                    </Text>
                  </View>
                )}
                {device.category === 'ranger' && device.team && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Team:</Text>
                    <Text style={styles.infoValue}>{device.team}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Location Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Data</Text>
              <View style={styles.infoCard}>
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={BRAND_COLORS.TEXT_SECONDARY} />
                  <View style={styles.locationContent}>
                    <Text style={styles.locationLabel}>Current Location</Text>
                    <Text style={styles.locationValue}>
                      {device.location || 'No GPS Data'}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Update:</Text>
                  <Text style={styles.infoValue}>{formatTimeSince(device.lastPing)}</Text>
                </View>
                {device.category === 'animal' && device.pathColor && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Path Color:</Text>
                    <View style={[styles.colorIndicator, { backgroundColor: device.pathColor }]} />
                  </View>
                )}
              </View>
            </View>

            {/* Battery Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Battery Level</Text>
              <View style={styles.infoCard}>
                <View style={styles.batteryHeader}>
                  <MaterialCommunityIcons name="battery" size={20} color={batteryColor} />
                  <Text style={[styles.batteryValue, { color: batteryColor }]}>
                    {Math.round(device.battery)}%
                  </Text>
                </View>
                <View style={styles.batteryBar}>
                  <View style={[
                    styles.batteryFill,
                    { width: `${device.battery}%`, backgroundColor: batteryColor }
                  ]} />
                </View>
                {device.battery < 30 && (
                  <View style={[styles.warningBox, { backgroundColor: STATUS_COLORS.WARNING + '20' }]}>
                    <MaterialCommunityIcons name="alert" size={16} color={STATUS_COLORS.WARNING} />
                    <Text style={[styles.warningText, { color: STATUS_COLORS.WARNING }]}>
                      Low battery - consider replacing soon
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Signal Strength */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Signal Strength</Text>
              <View style={styles.infoCard}>
                <View style={styles.batteryHeader}>
                  <MaterialCommunityIcons 
                    name="signal" 
                    size={20} 
                    color={device.signalStrength > 50 ? STATUS_COLORS.SUCCESS : STATUS_COLORS.WARNING} 
                  />
                  <Text style={[
                    styles.batteryValue,
                    { color: device.signalStrength > 50 ? STATUS_COLORS.SUCCESS : STATUS_COLORS.WARNING }
                  ]}>
                    {Math.round(device.signalStrength)}%
                  </Text>
                </View>
                <View style={styles.batteryBar}>
                  <View style={[
                    styles.batteryFill,
                    { 
                      width: `${device.signalStrength}%`,
                      backgroundColor: device.signalStrength > 50 ? STATUS_COLORS.SUCCESS : STATUS_COLORS.WARNING
                    }
                  ]} />
                </View>
                {device.signalStrength < 50 && (
                  <View style={[styles.warningBox, { backgroundColor: STATUS_COLORS.WARNING + '20' }]}>
                    <MaterialCommunityIcons name="alert" size={16} color={STATUS_COLORS.WARNING} />
                    <Text style={[styles.warningText, { color: STATUS_COLORS.WARNING }]}>
                      Weak signal - device may have connectivity issues
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Alert Warning */}
            {device.hasAlert && (
              <View style={[styles.alertBox, { backgroundColor: STATUS_COLORS.ERROR + '15' }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color={STATUS_COLORS.ERROR} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: STATUS_COLORS.ERROR }]}>
                    Active Alert
                  </Text>
                  <Text style={styles.alertText}>
                    This device has an active alert. Check the alerts section for more details.
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => {
                  onClose();
                  // Navigate to map with device filter
                  if (device.category === 'animal') {
                    // Navigate to map screen with animal filter
                    console.log('Navigate to map with animal:', device.id);
                  } else if (device.category === 'ranger') {
                    // Navigate to map screen with ranger filter
                    console.log('Navigate to map with ranger:', device.id);
                  }
                }}
              >
                <MaterialCommunityIcons name="map" size={20} color="white" />
                <Text style={styles.primaryButtonText}>View on Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  deviceSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  infoLabel: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationContent: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    fontFamily: 'monospace',
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  batteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batteryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  batteryBar: {
    height: 8,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: STATUS_COLORS.ERROR + '30',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.TERRA_COTTA,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DeviceDetailsModal;

