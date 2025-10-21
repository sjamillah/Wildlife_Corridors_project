import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from '../../../components/ui/Icon';
import { Card } from '../../../components/ui/Card';
import { LogoHeader } from '../../../components/ui/LogoHeader';
import SmartMap from '../../../components/maps/SmartMap';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '../../../constants/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <LogoHeader />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alerts Summary - Interactive Clean Cards */}
        <Card variant="elevated" style={styles.alertsCard}>
          <View style={styles.cardHeaderSimple}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Alerts</Text>
            <TouchableOpacity onPress={handleViewAlerts}>
              <Text style={[styles.viewAllLink, { color: BRAND_COLORS.PRIMARY }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.alertsGrid}>
            <TouchableOpacity 
              style={[styles.alertCardClean, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleViewAlerts}
              activeOpacity={0.7}
            >
              <Text style={[styles.alertNumber, { color: STATUS_COLORS.ERROR }]}>{alertCounts.Critical}</Text>
              <Text style={[styles.alertLabel, { color: colors.textSecondary }]}>Critical</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.alertCardClean, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleViewAlerts}
              activeOpacity={0.7}
            >
              <Text style={[styles.alertNumber, { color: STATUS_COLORS.WARNING }]}>{alertCounts.High}</Text>
              <Text style={[styles.alertLabel, { color: colors.textSecondary }]}>High</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.alertCardClean, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleViewAlerts}
              activeOpacity={0.7}
            >
              <Text style={[styles.alertNumber, { color: STATUS_COLORS.INFO }]}>{alertCounts.Medium}</Text>
              <Text style={[styles.alertLabel, { color: colors.textSecondary }]}>Medium</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Location Overview */}
        <Card variant="outlined">
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <View style={styles.mapOverview}>
            <View style={styles.mapPreviewContainer}>
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
                height={120}
              />
            </View>
            
            <View style={styles.locationInfo}>
              <Text style={[styles.locationName, { color: colors.text }]}>Maasai Mara Reserve</Text>
              <Text style={[styles.coordsText, { color: colors.textSecondary }]}>-1.4061° S, 35.0117° E</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions - Organized Grid */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.actionsGridClean}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: BRAND_COLORS.PRIMARY }]}
              onPress={() => router.push('/screens/(tabs)/MapScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.MAP} size={ICON_SIZES.lg} color={BRAND_COLORS.SURFACE} />
              <Text style={styles.actionLabel}>Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: STATUS_COLORS.SUCCESS }]}
              onPress={() => router.push('/screens/(tabs)/FieldDataScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.DOCUMENT} size={ICON_SIZES.lg} color={BRAND_COLORS.SURFACE} />
              <Text style={styles.actionLabel}>Log Data</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.emergencyButton, { backgroundColor: STATUS_COLORS.ERROR }]}
            onPress={() => router.push('/screens/(tabs)/AlertsScreen')}
            activeOpacity={0.8}
          >
            <Icon name={WILDLIFE_ICONS.ALERT_OCTAGON} size={ICON_SIZES.md} color="#fff" />
            <Text style={styles.emergencyText}>Emergency Alert</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  alertsCard: {
    marginBottom: 16,
  },
  cardHeaderSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCardClean: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER,
  },
  alertNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
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
  mapOverview: {
    gap: 12,
  },
  mapPreviewContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  locationInfo: {
    gap: 6,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 13,
  },
  actionsGridClean: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
