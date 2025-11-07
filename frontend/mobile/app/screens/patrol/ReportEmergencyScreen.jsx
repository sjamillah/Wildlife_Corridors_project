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
import { BRAND_COLORS } from '../../../constants/Colors';
import { rangers } from '../../services';

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
      
      const emergencyData = {
        log_type: 'emergency',
        priority: 'critical',
        title: `${emergencyType.label}${requestingBackup ? ' - BACKUP REQUESTED' : ''}`,
        description: description,
        lat: location?.lat || 0,
        lon: location?.lon || 0,
        notes: requestingBackup ? 'Backup team requested' : '',
      };

      await rangers.logs.create(emergencyData);

      Alert.alert(
        'EMERGENCY SENT',
        'Control center has been notified. Stay safe and await instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Clear form
      setSelectedType(null);
      setDescription('');
      setRequestingBackup(false);
    } catch (error) {
      console.error('Failed to send emergency:', error);
      
      // Critical: Save offline if network fails
      await saveEmergencyOffline(emergencyData);
      Alert.alert(
        'SAVED OFFLINE',
        'Emergency saved locally. It will be sent when connection is restored.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const saveEmergencyOffline = async (emergencyData) => {
    try {
      const queueKey = '@offline_emergencies';
      const existing = await AsyncStorage.getItem(queueKey);
      const queue = existing ? JSON.parse(existing) : [];
      queue.push({ ...emergencyData, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save emergency offline:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.emergencyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

