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
import { useAlerts } from '../../../contexts/AlertsContext';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

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
        { label: 'Poaching Activity', emoji: '🚨' },
        { label: 'Human-Wildlife Conflict', emoji: '⚠️' },
        { label: 'Equipment Malfunction', emoji: '⚙️' },
        { label: 'Security Breach', emoji: '🔒' },
        { label: 'Fire Outbreak', emoji: '🔥' },
        { label: 'Injured Animal', emoji: '🩹' },
        { label: 'Fence Damage', emoji: '🪛' },
        { label: 'Vehicle Breakdown', emoji: '🚙' },
        { label: 'Other', emoji: '📋' }
      ],
      hasSeverity: false,
    },
    obstruction: {
      title: 'Obstruction',
      types: [
        { label: 'Fallen Tree', emoji: '🌳' },
        { label: 'Rock Slide', emoji: '🪨' },
        { label: 'Flood Damage', emoji: '💧' },
        { label: 'Road Erosion', emoji: '🛣️' },
        { label: 'Debris Pile', emoji: '🪵' },
        { label: 'Mud Slide', emoji: '🌊' },
        { label: 'Other', emoji: '⚠️' }
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
        { label: 'Elephant', emoji: '🐘' },
        { label: 'Wildebeest', emoji: '🦬' },
        { label: 'Other', emoji: '🦘' }
      ],
      otherOptions: [
        { label: 'Lion', emoji: '🦁' },
        { label: 'Rhino', emoji: '🦏' },
        { label: 'Giraffe', emoji: '🦒' },
        { label: 'Zebra', emoji: '🦓' },
        { label: 'Buffalo', emoji: '🐃' },
        { label: 'Leopard', emoji: '🐆' },
        { label: 'Cheetah', emoji: '🐆' },
        { label: 'Hyena', emoji: '🐺' },
        { label: 'Custom', emoji: '❓' }
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

  const handleSubmit = () => {
    if (!formData.type) {
      Alert.alert('Validation Error', 'Please select a type');
      return;
    }
    if (currentConfig.hasSeverity && !formData.severity) {
      Alert.alert('Validation Error', 'Please select severity level');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', `${currentConfig.title} report submitted successfully!`);
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
    }, 1500);
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
          onPress={() => router.push('/screens/(tabs)/DashboardScreen')}
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
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>1</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Select Type</Text>
            <View style={styles.typeGrid}>
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
                    styles.typeCard,
                    formData.type === item.label && styles.typeCardSelected
                  ]}
                >
                  <Text style={styles.typeEmoji}>{item.emoji}</Text>
                  <Text style={styles.typeLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
                      <Text style={styles.typeEmoji}>{item.emoji}</Text>
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
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
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
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
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
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>{currentConfig.hasSeverity ? '2' : currentReportType === 'wildlife' ? '3' : '2'}</Text>
          </View>
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
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>{currentConfig.hasSeverity ? '3' : currentReportType === 'wildlife' ? '4' : '3'}</Text>
          </View>
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.TEXT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionNumberText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionContent: {
    flex: 1,
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
