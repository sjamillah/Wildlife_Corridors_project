import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from '../../../components/ui/Icon';
import SmartMap from '../../../components/maps/SmartMap';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '../../../constants/Icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const [alertCounts] = useState({
    Critical: 2,
    High: 1,
    Medium: 1
  });

  // Sample data for dashboard map
  const [dashboardMarkers] = useState([
    { id: 1, lat: -1.4061, lng: 35.0117, type: 'alert', priority: 'critical', title: 'Elephant Conflict' },
    { id: 2, lat: -1.3950, lng: 35.0300, type: 'checkpoint', title: 'Main Gate Station' },
    { id: 3, lat: -1.4150, lng: 34.9900, type: 'patrol', title: 'Anti-Poaching Patrol' },
    { id: 4, lat: -1.3800, lng: 35.0500, type: 'vehicle', title: 'Mobile Vet Unit' }
  ]);

  const [animalMovements] = useState([
    {
      animalType: 'elephant',
      color: STATUS_COLORS.WARNING,
      path: [
        { lat: -1.4000, lng: 35.0000 },
        { lat: -1.4050, lng: 35.0100 },
        { lat: -1.4061, lng: 35.0117 }
      ],
      timestamp: Date.now() - 300000 // 5 minutes ago
    },
    {
      animalType: 'lion',
      color: BRAND_COLORS.PRIMARY,
      path: [
        { lat: -1.4100, lng: 35.0200 },
        { lat: -1.4080, lng: 35.0150 },
        { lat: -1.4050, lng: 35.0100 }
      ],
      timestamp: Date.now() - 600000 // 10 minutes ago
    }
  ]);

  const [userLocation] = useState({ lat: -1.4061, lng: 35.0117 });

  const handleViewAlerts = () => {
    router.push('/screens/(tabs)/AlertsScreen');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Large Green Header */}
      <View style={styles.largeHeader}>
        <View style={styles.headerContent}>
          {/* Left Column */}
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../assets/images/Aureynx_Logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>
          
          {/* Right Column */}
          <View style={styles.headerRight}>
            <View style={styles.onlineStatusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationBox}
              onPress={handleViewAlerts}
            >
              <Text style={styles.bellEmoji}>🔔</Text>
              <View style={styles.notificationDot}>
                <Text style={styles.notificationNumber}>
                  {alertCounts.Critical + alertCounts.High + alertCounts.Medium}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Alert Chips Integrated in Header */}
        <View style={styles.alertChips}>
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.Critical}</Text>
            <Text style={styles.alertChipLabel}>Critical</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(232, 150, 28, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.High}</Text>
            <Text style={styles.alertChipLabel}>High</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.Medium}</Text>
            <Text style={styles.alertChipLabel}>Medium</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={() => router.push('/screens/(tabs)/MapScreen')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationCard}>
            {/* Map Area */}
            <View style={styles.mapArea}>
              <SmartMap
                markers={dashboardMarkers}
                userLocation={userLocation}
                animalMovements={animalMovements}
                corridorBounds={{
                  north: -1.3500,
                  south: -1.4500,
                  east: 35.1000,
                  west: 34.9500
                }}
                showGeofence={true}
                showPatrolRoutes={false}
                height={200}
              />
              {/* Location Label on Map */}
              <View style={styles.mapLocationLabel}>
                <Text style={styles.mapLabelText}>📍 Maasai Mara Reserve</Text>
              </View>
            </View>
            
            {/* Location Info */}
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Maasai Mara Reserve</Text>
              <Text style={styles.locationCoords}>-1.4061° S, 35.0117° E</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.mapButton]}
              onPress={() => router.push('/screens/(tabs)/MapScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.MAP} size={ICON_SIZES.md} color={BRAND_COLORS.SURFACE} />
              <Text style={styles.actionBtnText}>Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.reportButton]}
              onPress={() => router.push('/screens/(tabs)/FieldDataScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.DOCUMENT} size={ICON_SIZES.md} color={BRAND_COLORS.TEXT} />
              <Text style={[styles.actionBtnText, { color: BRAND_COLORS.TEXT }]}>Report</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.emergencyBtn}
            onPress={() => router.push('/screens/(tabs)/AlertsScreen')}
            activeOpacity={0.8}
          >
            <Icon name={WILDLIFE_ICONS.ALERT_OCTAGON} size={ICON_SIZES.md} color={BRAND_COLORS.SURFACE} />
            <Text style={styles.emergencyBtnText}>Emergency Alert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  largeHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 120,
    height: 38,
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_COLORS.SURFACE,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  onlineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS_COLORS.SUCCESS,
  },
  onlineText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '600',
  },
  notificationBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellEmoji: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationNumber: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 10,
    fontWeight: '800',
  },
  alertChips: {
    flexDirection: 'row',
    gap: 8,
  },
  alertChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertChipNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_COLORS.SURFACE,
    marginBottom: 2,
  },
  alertChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.ACCENT,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  locationCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  mapArea: {
    height: 200,
    backgroundColor: BRAND_COLORS.PRIMARY,
    position: 'relative',
  },
  mapLocationLabel: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapLabelText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 12,
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: BRAND_COLORS.SURFACE,
    padding: 16,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 11,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  mapButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  reportButton: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    backgroundColor: BRAND_COLORS.ACCENT,
  },
  emergencyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  miniMapBackground: {
    flex: 1,
    backgroundColor: '#2d5a3d',
    position: 'relative',
  },
  miniGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    opacity: 0.2,
  },
  miniGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    opacity: 0.2,
  },
  alertMarker: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'white',
  },
  miniUserLocation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  miniLocationDot: {
    width: 8,
    height: 8,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

