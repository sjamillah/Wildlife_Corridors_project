import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND_COLORS } from '@constants/Colors';
import { rangers, auth as authService } from '@services';
import { safeNavigate } from '@utils';
// Don't import prioritySyncQueue at top level - import dynamically to prevent SSR issues

const EMERGENCY_TYPES = [
  { id: 'poacher', label: 'Poacher Activity', icon: 'account-alert', color: '#ef4444' },
  { id: 'injured_animal', label: 'Injured Animal', icon: 'medical-bag', color: '#f59e0b' },
  { id: 'illegal_logging', label: 'Illegal Logging', icon: 'tree-outline', color: '#f97316' },
  { id: 'fire', label: 'Wildfire', icon: 'fire', color: '#dc2626' },
  { id: 'other', label: 'Other Emergency', icon: 'alert-circle', color: '#991b1b' },
];

const ReportEmergencyScreen = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [requestingBackup, setRequestingBackup] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for emergencies');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: currentLocation.coords.latitude,
        lon: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location. Emergency still sent with last known position.');
    }
  };

  const submitEmergency = async () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select an emergency type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Add Details', 'Please describe the emergency situation');
      return;
    }

    Alert.alert(
      'CONFIRM EMERGENCY',
      'This will send an alert to the control center and all nearby rangers. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND EMERGENCY',
          style: 'destructive',
          onPress: async () => await sendEmergency(),
        },
      ]
    );
  };

  const sendEmergency = async () => {
    setLoading(true);
    try {
      const emergencyType = EMERGENCY_TYPES.find(t => t.id === selectedType);
      
      // Get ranger and team info with error handling
      let userProfile = null;
      let rangerId = null;
      let teamId = null;
      try {
        userProfile = await authService.getProfile();
        rangerId = userProfile?.ranger_id || userProfile?.id;
        teamId = userProfile?.team_id;
      } catch (profileError) {
        console.warn('Failed to get user profile:', profileError);
        // Continue without profile - emergency is more important
      }
      
      // Get current location or last known
      const currentLocation = location || await getLastKnownLocation();
      
      const emergencyData = {
        ranger: rangerId,
        team: teamId,
        log_type: 'emergency',
        priority: 'critical',
        title: `${emergencyType.label}${requestingBackup ? ' - BACKUP REQUESTED' : ''}`,
        description: description,
        lat: currentLocation?.lat || 0,
        lon: currentLocation?.lon || 0,
        notes: requestingBackup ? 'Backup team requested' : '',
        timestamp: new Date().toISOString(),
      };

      // Create alert data for managers (CRITICAL - sends via WebSocket)
      const { alerts: alertsService } = await import('@services');
      const alertData = {
        alert_type: 'emergency',
        severity: 'critical',
        title: `EMERGENCY: ${emergencyType.label}`,
        message: `${description}${requestingBackup ? ' - BACKUP REQUESTED' : ''}`,
        latitude: currentLocation?.lat || 0,
        longitude: currentLocation?.lon || 0,
        ranger_id: rangerId,
        ranger_name: userProfile?.name || 'Unknown Ranger',
        team_id: teamId,
        source: 'mobile_emergency',
        status: 'active',
        priority: 'critical',
        requires_immediate_response: true
      };

      // Try to send both emergency log and alert immediately
      let emergencySent = false;
      let alertSent = false;

      try {
        // Send emergency log (creates alert on backend)
        await rangers.logs.create(emergencyData);
        emergencySent = true;
        console.log('✅ Emergency log created');
      } catch (logError) {
        console.error('Failed to create emergency log:', logError);
        // Continue - we'll still try to send alert
      }

      try {
        // Create alert directly for managers (CRITICAL - sends via WebSocket)
        await alertsService.create(alertData);
        alertSent = true;
        console.log('✅ Emergency alert created - managers notified');
      } catch (alertError) {
        console.error('Failed to create alert directly:', alertError);
        
        // Queue for retry using prioritySyncQueue if available
        try {
          const prioritySyncQueue = (await import('@services/prioritySyncQueue')).default;
          await prioritySyncQueue.add({
            data: alertData,
            endpoint: '/api/v1/alerts/alerts/',
            priority: 'high',
            maxRetries: 30,
            retryInterval: 3000,
          });
          prioritySyncQueue.startAutoSync();
          console.log('✅ Alert queued for sync');
        } catch (queueError) {
          console.error('Failed to queue alert:', queueError);
          // Still show success - at least we tried
        }
      }

      // Show success if either was sent
      if (emergencySent || alertSent) {
          Alert.alert(
            'EMERGENCY SENT',
            'Control center and managers have been notified. Stay safe and await instructions.',
            [{ 
              text: 'OK', 
              onPress: () => {
                try {
                  // Clear form
                  setSelectedType(null);
                  setDescription('');
                  setRequestingBackup(false);
                  // Navigate back safely
                  router.back();
                } catch (navError) {
                  console.warn('Navigation error:', navError);
                  safeNavigate('/screens/(tabs)/DashboardScreen');
                }
              }
            }]
          );
      } else {
        // Both failed - queue for offline
        await queueEmergency(emergencyData, emergencyType.label);
      }

    } catch (error) {
      console.error('❌ Failed to send emergency:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error';
      Alert.alert(
        'ERROR',
        `Failed to send emergency: ${errorMessage}\n\nPlease try again or contact support immediately.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const queueEmergency = async (emergencyData, emergencyTypeLabel) => {
    try {
      // Try to use prioritySyncQueue if available
      let queueSuccess = false;
      try {
        const prioritySyncQueue = (await import('@services/prioritySyncQueue')).default;
        
        // Queue emergency log
        await prioritySyncQueue.add({
          data: emergencyData,
          endpoint: '/api/v1/rangers/logs/',
          priority: 'high',
          maxRetries: 30,
          retryInterval: 3000,
        });
        
        // Queue alert for managers
        const userProfile = await authService.getProfile().catch(() => null);
        const alertData = {
          alert_type: 'emergency',
          severity: 'critical',
          title: `EMERGENCY: ${emergencyTypeLabel}`,
          message: `${emergencyData.description}${emergencyData.notes ? ' - ' + emergencyData.notes : ''}`,
          latitude: emergencyData.lat || 0,
          longitude: emergencyData.lon || 0,
          ranger_id: emergencyData.ranger,
          ranger_name: userProfile?.name || 'Unknown Ranger',
          team_id: emergencyData.team,
          source: 'mobile_emergency',
          status: 'active',
          priority: 'critical',
          requires_immediate_response: true
        };
        
        await prioritySyncQueue.add({
          data: alertData,
          endpoint: '/api/v1/alerts/alerts/',
          priority: 'high',
          maxRetries: 30,
          retryInterval: 3000,
        });
        
        prioritySyncQueue.startAutoSync();
        queueSuccess = true;
      } catch (queueError) {
        console.warn('Priority queue not available, saving to AsyncStorage:', queueError);
        // Fallback: save to AsyncStorage for manual sync
        try {
          const stored = await AsyncStorage.getItem('pending_emergencies') || '[]';
          const pending = JSON.parse(stored);
          pending.push({
            ...emergencyData,
            alertData: {
              alert_type: 'emergency',
              severity: 'critical',
              title: `EMERGENCY: ${emergencyTypeLabel}`,
              message: `${emergencyData.description}${emergencyData.notes ? ' - ' + emergencyData.notes : ''}`,
              latitude: emergencyData.lat || 0,
              longitude: emergencyData.lon || 0,
              ranger_id: emergencyData.ranger,
              source: 'mobile_emergency',
              status: 'active',
              priority: 'critical',
            },
            timestamp: new Date().toISOString()
          });
          await AsyncStorage.setItem('pending_emergencies', JSON.stringify(pending));
          queueSuccess = true;
        } catch (storageError) {
          console.error('Failed to save to storage:', storageError);
        }
      }
      
      if (queueSuccess) {
        Alert.alert(
          'EMERGENCY QUEUED',
          'Emergency saved offline. It will be sent to managers immediately when connection is restored.',
          [{ 
            text: 'OK', 
            onPress: () => {
              try {
                setSelectedType(null);
                setDescription('');
                setRequestingBackup(false);
                router.back();
              } catch (navError) {
                console.warn('Navigation error:', navError);
                safeNavigate('/screens/(tabs)/DashboardScreen');
              }
            }
          }]
        );
      } else {
        throw new Error('Failed to queue emergency');
      }
    } catch (error) {
      console.error('❌ Failed to queue emergency:', error);
      Alert.alert(
        'ERROR',
        `Failed to save emergency: ${error.message}\n\nPlease check your connection and try again, or contact support immediately.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getLastKnownLocation = async () => {
    try {
      // Try to get current location first
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000, // 5 second timeout for faster response
          });
          return {
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
          };
        } catch {
          // Fall through to stored location
        }
      }
      
      // Fallback to stored location
      const stored = await AsyncStorage.getItem('last_known_location');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.emergencyHeader}>
        <TouchableOpacity 
          onPress={() => {
            try {
              router.back();
            } catch (error) {
              console.warn('Navigation error:', error);
              safeNavigate('/screens/(tabs)/DashboardScreen');
            }
          }} 
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.emergencyHeaderTitle}>REPORT EMERGENCY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Emergency Warning */}
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#dc2626" />
          <Text style={styles.warningText}>
            Only use for actual emergencies. False alarms waste resources.
          </Text>
        </View>

        {/* Location Display */}
        {location && (
          <View style={styles.locationCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#ef4444" />
            <Text style={styles.locationCardText}>
              Your location will be sent: {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
            </Text>
          </View>
        )}

        {/* Emergency Type Selection */}
        <Text style={styles.sectionTitle}>Emergency Type</Text>
        <View style={styles.typeGrid}>
          {EMERGENCY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonSelected,
                { borderColor: type.color },
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <MaterialCommunityIcons
                name={type.icon}
                size={32}
                color={selectedType === type.id ? type.color : BRAND_COLORS.TEXT_SECONDARY}
              />
              <Text style={[
                styles.typeButtonText,
                selectedType === type.id && { color: type.color, fontWeight: '700' }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the emergency situation in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
        />

        {/* Backup Request */}
        <TouchableOpacity
          style={styles.backupCheckbox}
          onPress={() => setRequestingBackup(!requestingBackup)}
        >
          <MaterialCommunityIcons
            name={requestingBackup ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={requestingBackup ? '#ef4444' : BRAND_COLORS.TEXT_SECONDARY}
          />
          <Text style={styles.backupCheckboxText}>Request Backup Team</Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.emergencyButton, loading && styles.emergencyButtonDisabled]}
          onPress={submitEmergency}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="alarm-light" size={24} color="white" />
              <Text style={styles.emergencyButtonText}>SEND EMERGENCY ALERT</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  emergencyHeader: {
    backgroundColor: '#dc2626',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  warningBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  locationCardText: {
    flex: 1,
    fontSize: 12,
    color: '#7f1d1d',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    width: '47%',
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  typeButtonSelected: {
    borderWidth: 3,
    backgroundColor: '#fef2f2',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    textAlign: 'center',
  },
  input: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: BRAND_COLORS.TEXT,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  backupCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  backupCheckboxText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyButtonDisabled: {
    opacity: 0.6,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});

export default ReportEmergencyScreen;

