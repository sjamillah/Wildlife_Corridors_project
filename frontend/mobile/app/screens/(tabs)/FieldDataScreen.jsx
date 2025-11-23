import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAlerts } from '@contexts/AlertsContext';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { observations, animals, rangers, reports } from '@services';
import { safeNavigate } from '@utils';

export default function FieldDataScreen() {
  const { addAlert } = useAlerts();
  
  const [currentReportType, setCurrentReportType] = useState('wildlife');
  const [formData, setFormData] = useState({
    type: '',
    animalName: '',
    severity: '',
    species: '',
    count: 1,
    notes: '',
    location: null,
    photos: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Report type configurations
  const reportTypes = {
    incident: {
      title: 'Incident',
      types: [
        { label: 'Poaching Activity', icon: 'alert-octagon' },
        { label: 'Human-Wildlife Conflict', icon: 'alert-circle' },
        { label: 'Equipment Malfunction', icon: 'wrench' },
        { label: 'Security Breach', icon: 'shield-alert' },
        { label: 'Fire Outbreak', icon: 'fire' },
        { label: 'Injured Animal', icon: 'medical-bag' },
        { label: 'Fence Damage', icon: 'gate-alert' },
        { label: 'Vehicle Breakdown', icon: 'car-wrench' },
        { label: 'Other', icon: 'file-document' }
      ],
      hasSeverity: false,
    },
    obstruction: {
      title: 'Obstruction',
      types: [
        { label: 'Fallen Tree', icon: 'tree' },
        { label: 'Rock Slide', icon: 'image-filter-hdr' },
        { label: 'Flood Damage', icon: 'water-alert' },
        { label: 'Road Erosion', icon: 'road' },
        { label: 'Debris Pile', icon: 'package-variant' },
        { label: 'Mud Slide', icon: 'waves' },
        { label: 'Other', icon: 'alert' }
      ],
      hasSeverity: true,
      severityLevels: [
        { level: 'Critical', color: STATUS_COLORS.ERROR, description: 'Complete blockage, immediate action required' },
        { level: 'High', color: BRAND_COLORS.HIGHLIGHT, description: 'Major obstruction, affects operations' },
        { level: 'Medium', color: STATUS_COLORS.SUCCESS, description: 'Partial obstruction, manageable' }
      ]
    },
    wildlife: {
      title: 'Wildlife',
      types: [
        { label: 'Elephant', icon: 'elephant' },
        { label: 'Wildebeest', icon: 'cow' },
        { label: 'Other', icon: 'paw' }
      ],
      otherOptions: [
        { label: 'Lion', icon: 'google-circles-communities' },
        { label: 'Rhino', icon: 'rhombus' },
        { label: 'Giraffe', icon: 'giraffe' },
        { label: 'Zebra', icon: 'horse' },
        { label: 'Buffalo', icon: 'cow' },
        { label: 'Leopard', icon: 'cat' },
        { label: 'Cheetah', icon: 'cat' },
        { label: 'Hyena', icon: 'dog' },
        { label: 'Custom', icon: 'help-circle' }
      ],
      hasSeverity: false,
      hasName: true,
      hasPhotos: true,
      hasLocation: true,
    }
  };

  const otherWildlifeOptions = reportTypes.wildlife.otherOptions || [];

  const currentConfig = reportTypes[currentReportType];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      updateFormData('location', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const pickImage = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable camera permissions');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable photo library permissions');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        updateFormData('photos', [...formData.photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData('photos', newPhotos);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.type) {
      Alert.alert('Validation Error', 'Please select a type');
      return;
    }
    if (currentConfig.hasSeverity && !formData.severity) {
      Alert.alert('Validation Error', 'Please select severity level');
      return;
    }

    setIsSubmitting(true);

    try {
      // Wrap everything in try-catch to prevent crashes
      // Create report via reports endpoint (which will create alerts)
      const reportData = {
        title: formData.type || `${currentConfig.title} Report`,
        description: formData.notes || `${formData.type || currentConfig.title} reported`,
        category: currentReportType,
        format: 'json',
      };

      // Add location if available
      if (formData.location?.coords) {
        reportData.latitude = formData.location.coords.latitude;
        reportData.longitude = formData.location.coords.longitude;
      }

      // Add species-specific data for wildlife reports
      if (currentReportType === 'wildlife') {
        reportData.species_filter = formData.type;
        if (formData.animalName) {
          reportData.animal_id = formData.animalName;
        }
      }

      // Add severity for incidents/obstructions
      if (formData.severity) {
        reportData.severity = formData.severity;
      }

      // Create report via generate endpoint (this should create alerts automatically)
      let reportResponse = null;
      let reportCreated = false;
      
      try {
        reportResponse = await Promise.race([
          reports.generate(reportData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Report creation timeout')), 30000)
          )
        ]);
        console.log('✅ Report created:', reportResponse);
        reportCreated = true;
      } catch (reportError) {
        console.error('Report creation failed, trying fallback:', reportError);
        // Try regular create endpoint as fallback
        try {
          reportResponse = await Promise.race([
            reports.create(reportData),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Report creation timeout')), 30000)
            )
          ]);
          console.log('✅ Report created via fallback:', reportResponse);
          reportCreated = true;
        } catch (fallbackError) {
          console.error('Both report creation methods failed:', fallbackError);
          // Don't throw - we'll still try to create alert
          reportCreated = false;
        }
      }
      
      if (!reportCreated) {
        console.warn('⚠️ Report creation failed, but continuing with alert creation');
      }

      // ALWAYS create an alert for managers (even if backend auto-creates, we ensure it's sent)
      let alertCreated = false;
      try {
        const { alerts: alertsService } = await import('@services');
        const alertData = {
          title: formData.type || `${currentConfig.title} Report`,
          message: formData.notes || `${formData.type || currentConfig.title} reported`,
          alert_type: currentReportType === 'incident' ? 'incident' : 
                     currentReportType === 'obstruction' ? 'obstruction' : 
                     'wildlife_sighting',
          severity: formData.severity || (currentReportType === 'incident' ? 'high' : 'medium'),
          latitude: formData.location?.latitude || formData.location?.coords?.latitude || 0,
          longitude: formData.location?.longitude || formData.location?.coords?.longitude || 0,
          status: 'active',
          source: 'mobile_app',
        };
        
        // Create alert with timeout - this sends to managers via WebSocket
        await Promise.race([
          alertsService.create(alertData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Alert creation timeout')), 30000)
          )
        ]);
        alertCreated = true;
        console.log('✅ Alert created successfully for report - managers notified');
      } catch (alertError) {
        console.error('❌ Failed to create alert:', alertError);
        // Try to queue for later sync
        try {
          const prioritySyncQueue = (await import('@services/prioritySyncQueue')).default;
          const alertData = {
            title: formData.type || `${currentConfig.title} Report`,
            message: formData.notes || `${formData.type || currentConfig.title} reported`,
            alert_type: currentReportType === 'incident' ? 'incident' : 
                       currentReportType === 'obstruction' ? 'obstruction' : 
                       'wildlife_sighting',
            severity: formData.severity || (currentReportType === 'incident' ? 'high' : 'medium'),
            latitude: formData.location?.latitude || formData.location?.coords?.latitude || 0,
            longitude: formData.location?.longitude || formData.location?.coords?.longitude || 0,
            status: 'active',
            source: 'mobile_app',
          };
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
        }
      }

      // Also save as observation for backward compatibility
      if (currentReportType === 'wildlife') {
        const observationData = {
          observation_type: 'sighting',
          species: formData.type,
          count: formData.count || 1,
          notes: formData.notes || `${formData.type} sighting`,
          latitude: formData.location?.coords?.latitude || null,
          longitude: formData.location?.coords?.longitude || null,
          observed_at: new Date().toISOString(),
        };
        await observations.create(observationData).catch(err => console.log('Observation save failed (non-critical):', err));
      } else if (currentReportType === 'incident' || currentReportType === 'obstruction') {
        const observationData = {
          observation_type: currentReportType,
          notes: `${formData.type}: ${formData.notes || 'No additional notes'}`,
          severity: formData.severity || null,
          latitude: formData.location?.coords?.latitude || null,
          longitude: formData.location?.coords?.longitude || null,
          observed_at: new Date().toISOString(),
        };
        await observations.create(observationData).catch(err => console.log('Observation save failed (non-critical):', err));
      }

      setIsSubmitting(false);
      
      // Show success message based on what was created
      const successMessage = reportCreated && alertCreated
        ? `${currentConfig.title} report submitted successfully! Managers have been notified.`
        : reportCreated
        ? `${currentConfig.title} report saved. Alert will be sent when connection is restored.`
        : alertCreated
        ? `Alert sent to managers. Report may not have been saved.`
        : `Data queued for sync. Will be sent when connection is restored.`;
      
      Alert.alert(
        reportCreated || alertCreated ? 'Success' : 'Queued', 
        successMessage,
        [{ 
          text: 'OK', 
          onPress: () => {
            try {
              // Reset form
              setFormData({ 
                type: '', 
                animalName: '',
                severity: '', 
                species: '', 
                count: 1, 
                notes: '',
                location: null,
                photos: []
              });
              setShowOtherOptions(false);
              // Navigate back safely
              safeNavigate('/screens/(tabs)/DashboardScreen');
            } catch (error) {
              console.error('Error resetting form:', error);
            }
          }
        }]
      );

    } catch (error) {
      setIsSubmitting(false);
      console.error('❌ Failed to submit report:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      Alert.alert(
        'Error', 
        `Failed to save report: ${errorMessage}\n\nPlease check your connection and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => safeNavigate('/screens/(tabs)/DashboardScreen')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={BRAND_COLORS.SURFACE} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>New Report</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={styles.saveButton}>
          <Text style={[styles.saveText, { color: isSubmitting ? 'rgba(255,255,255,0.5)' : BRAND_COLORS.SURFACE }]}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Area */}
        <View style={styles.titleArea}>
          <Text style={styles.newReportLabel}>NEW REPORT</Text>
          <Text style={styles.reportTitle}>{currentConfig.title}</Text>
          
          {/* Report Type Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            <View style={styles.tabsContainer}>
              {Object.keys(reportTypes).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setCurrentReportType(key)}
                  style={[
                    styles.tab,
                    currentReportType === key && styles.activeTab
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    currentReportType === key && styles.activeTabText
                  ]}>
                    {reportTypes[key].title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Section 1: Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Select Type</Text>
            {/* Horizontal Slider for All Types (like wildlife) */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeSlider}
            >
              {currentConfig.types.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    updateFormData('type', item.label);
                    if (item.label === 'Other' && currentReportType === 'wildlife') {
                      setShowOtherOptions(true);
                    } else {
                      setShowOtherOptions(false);
                    }
                  }}
                  style={[
                    styles.typeCardSlider,
                    formData.type === item.label && styles.typeCardSelected
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={item.icon || 'help-circle'} 
                    size={32} 
                    color={formData.type === item.label ? BRAND_COLORS.SURFACE : BRAND_COLORS.TEXT} 
                  />
                  <Text style={styles.typeLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Show more wildlife options when "Other" is selected */}
            {showOtherOptions && currentReportType === 'wildlife' && (
              <View style={styles.otherOptionsContainer}>
                <Text style={styles.otherOptionsTitle}>More Wildlife Options</Text>
                <View style={styles.typeGrid}>
                  {otherWildlifeOptions.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => updateFormData('type', item.label)}
                      style={[
                        styles.typeCard,
                        formData.type === item.label && styles.typeCardSelected
                      ]}
                    >
                      <MaterialCommunityIcons 
                        name={item.icon || 'help-circle'} 
                        size={32} 
                        color={formData.type === item.label ? BRAND_COLORS.SURFACE : BRAND_COLORS.TEXT} 
                      />
                      <Text style={styles.typeLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Animal Name (Wildlife only) */}
        {currentReportType === 'wildlife' && formData.type && (
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Animal Name (Optional)</Text>
              <TextInput
                value={formData.animalName}
                onChangeText={(text) => updateFormData('animalName', text)}
                placeholder="e.g., Simba, Big Tusk..."
                placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                style={styles.nameInput}
              />
            </View>
          </View>
        )}

        {/* Section 2: Severity (for Obstruction) or Details */}
        {currentConfig.hasSeverity && (
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Severity Level</Text>
              {currentConfig.severityLevels.map(({ level, color, description }) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => updateFormData('severity', level)}
                  style={styles.severityRow}
                >
                  <View style={[styles.severityBorder, { backgroundColor: color }]} />
                  <View style={styles.severityInfo}>
                    <Text style={styles.severityName}>{level}</Text>
                    <Text style={styles.severityDesc}>{description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    formData.severity === level && styles.radioButtonSelected
                  ]}>
                    {formData.severity === level && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Location Section (All report types) */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color={BRAND_COLORS.SURFACE} />
              ) : (
                <>
                  <MaterialCommunityIcons name="map-marker" size={20} color={BRAND_COLORS.SURFACE} />
                  <Text style={styles.locationButtonText}>
                    {formData.location ? 'Location Captured ✓' : 'Get Current Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {formData.location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Lat: {formData.location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Lng: {formData.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additionals Section (All report types) - Notes & Photos */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Additionals (Optional)</Text>
            
            {/* Notes */}
            <Text style={styles.subSectionLabel}>Notes</Text>
            <TextInput
              value={formData.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              placeholder="Add any additional notes or details..."
              placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={3}
              style={styles.notesTextarea}
            />

            {/* Photos */}
            <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>Photos</Text>
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage('camera')}
              >
                <MaterialCommunityIcons name="camera" size={20} color={BRAND_COLORS.SURFACE} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage('gallery')}
              >
                <MaterialCommunityIcons name="image" size={20} color={BRAND_COLORS.SURFACE} />
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
            {formData.photos.length > 0 && (
              <ScrollView horizontal style={styles.photosContainer}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color={STATUS_COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Submit Bar */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            { backgroundColor: BRAND_COLORS.ACCENT },
            isSubmitting && styles.submitButtonDisabled
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={BRAND_COLORS.SURFACE} />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit {currentConfig.title} Report
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.SURFACE,
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
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleArea: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: BRAND_COLORS.SURFACE,
  },
  newReportLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
    marginBottom: 16,
  },
  tabsScroll: {
    marginHorizontal: -20,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  activeTab: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: BRAND_COLORS.SURFACE,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  sectionContent: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  subSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  typeSlider: {
    paddingRight: 20,
    gap: 12,
  },
  typeCardSlider: {
    width: 120,
    height: 140,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
    marginRight: 12,
    paddingVertical: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1.2,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  typeCardSelected: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  typeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    textAlign: 'center',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  severityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 8,
  },
  severityInfo: {
    flex: 1,
    paddingLeft: 8,
  },
  severityName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 2,
  },
  severityDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: BRAND_COLORS.PRIMARY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  notesTextarea: {
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: BRAND_COLORS.TEXT,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 0,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.SURFACE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  otherOptionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  otherOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: BRAND_COLORS.TEXT,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  locationButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
  },
  photosContainer: {
    marginTop: 12,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
  },
});
