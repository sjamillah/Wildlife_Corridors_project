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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAlerts } from '../../../contexts/AlertsContext';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';

export default function FieldDataScreen() {
  const { addAlert } = useAlerts();
  
  const [currentReportType, setCurrentReportType] = useState('incident');
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    species: '',
    count: 1,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        { label: 'Lion', emoji: '🦁' },
        { label: 'Rhino', emoji: '🦏' },
        { label: 'Giraffe', emoji: '🦒' },
        { label: 'Zebra', emoji: '🦓' },
        { label: 'Buffalo', emoji: '🐃' },
        { label: 'Leopard', emoji: '🐆' },
        { label: 'Other', emoji: '🦘' }
      ],
      hasSeverity: false,
    }
  };

  const currentConfig = reportTypes[currentReportType];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      setFormData({ type: '', severity: '', species: '', count: 1, notes: '' });
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
        </View>

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

        {!currentConfig.hasSeverity && (
          <View style={styles.section}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Details</Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                placeholder="Describe the incident..."
                placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                multiline
                numberOfLines={4}
                style={styles.detailsTextarea}
              />
            </View>
          </View>
        )}

        {/* Section 3: Notes */}
        <View style={styles.section}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>{currentConfig.hasSeverity ? '3' : '3'}</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              value={formData.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              placeholder="Add any additional information..."
              placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={3}
              style={styles.notesTextarea}
            />
          </View>
        </View>

        {/* Section 4: Location */}
        <View style={styles.section}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>4</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            {/* Location Display */}
            <View style={styles.locationDisplay}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationEmoji}>📍</Text>
                <View>
                  <Text style={styles.locationName}>Maasai Mara Reserve</Text>
                  <Text style={styles.locationCoords}>-1.4061° S, 35.0117° E</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Map Preview */}
            <View style={styles.simpleMap}>
              <View style={styles.mapPin}>
                <Text style={styles.mapPinText}>📍</Text>
              </View>
            </View>
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
  detailsTextarea: {
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: BRAND_COLORS.TEXT,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 0,
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
  locationDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.BACKGROUND,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationEmoji: {
    fontSize: 20,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  locationCoords: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.ACCENT,
  },
  simpleMap: {
    height: 220,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPin: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinText: {
    fontSize: 40,
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
});
