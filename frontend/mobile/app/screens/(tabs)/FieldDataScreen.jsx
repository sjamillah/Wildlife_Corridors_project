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
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAlerts } from '../../../contexts/AlertsContext';
import { Colors } from '../../../constants/Colors';

export default function FieldDataScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { addAlert } = useAlerts();
  
  const [currentReportType, setCurrentReportType] = useState('incident');
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    species: 'Elephant',
    count: 1,
    notes: '',
    hasPhoto: false,
    hasLocation: true,
    additionalData: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report type configurations
  const reportTypes = {
    incident: {
      title: 'Log Field Data',
      primaryField: 'type',
      icon: 'FileText',
      types: [
        'Equipment Malfunction',
        'Security Breach',
        'Environmental Hazard',
        'Wildlife Sighting',
        'Maintenance Required',
        'Safety Incident',
        'Other'
      ],
      hasSeverity: false,
      hasCount: false,
      hasSpecies: false
    },
    obstruction: {
      title: 'Report Obstruction',
      primaryField: 'type',
      icon: 'AlertTriangle',
      types: [
        'Fallen Tree',
        'Rock Slide',
        'Flood Damage',
        'Bridge Collapse',
        'Road Washout',
        'Debris',
        'Vehicle Breakdown',
        'Other'
      ],
      hasSeverity: true,
      hasCount: false,
      hasSpecies: false,
      severityLevels: [
        { 
          level: 'Critical', 
          color: '#F97316', 
          description: 'Complete blockage, immediate action required' 
        },
        { 
          level: 'High', 
          color: '#EF4444', 
          description: 'Major obstruction, affects operations' 
        },
        { 
          level: 'Medium', 
          color: '#10B981', 
          description: 'Partial obstruction, manageable' 
        }
      ]
    },
    wildlife: {
      title: 'New Sighting',
      primaryField: 'species',
      icon: 'Eye',
      types: [
        { name: 'Elephant', icon: 'elephant', iconColor: '#8B7355', description: 'African Elephant' },
        { name: 'Zebra', icon: 'horse-variant', iconColor: '#4A4A4A', description: 'Plains Zebra' },
        { name: 'Wildebeest', icon: 'cow', iconColor: '#8B4513', description: 'Blue Wildebeest' },
        { name: 'Tiger', icon: 'tiger', iconColor: '#FF8C00', description: 'Bengal Tiger' },
        { name: 'Lion', icon: 'lion', iconColor: '#DAA520', description: 'African Lion' },
        { name: 'Giraffe', icon: 'giraffe', iconColor: '#DEB887', description: 'Masai Giraffe' },
        { name: 'Rhinoceros', icon: 'rhino', iconColor: '#696969', description: 'Black Rhinoceros' },
        { name: 'Buffalo', icon: 'water-buffalo', iconColor: '#2F4F4F', description: 'African Buffalo' },
        { name: 'Other', icon: 'paw', iconColor: '#8FBC8F', description: 'Other Species' }
      ],
      hasSeverity: false,
      hasCount: true,
      hasSpecies: true
    }
  };

  const currentConfig = reportTypes[currentReportType];

  const adjustCount = (increment) => {
    const newCount = formData.count + increment;
    if (newCount >= 0) {
      updateFormData('count', newCount);
    }
  };

  const switchReportType = (newType) => {
    setCurrentReportType(newType);
    // Reset form when switching types
    setFormData({
      type: '',
      severity: '',
      species: 'Elephant',
      count: 1,
      notes: '',
      hasPhoto: false,
      hasLocation: true,
      additionalData: {}
    });
  };

  const handleSubmit = () => {
    // Validation based on report type
    if (currentConfig.hasSeverity && !formData.severity) {
      Alert.alert('Validation Error', 'Please select a severity level');
      return;
    }
    if (!formData.type && !formData.species) {
      Alert.alert('Validation Error', `Please select a ${currentConfig.primaryField}`);
      return;
    }

    setIsSubmitting(true);

    if (currentReportType === 'obstruction') {
      const alertData = {
        title: `${formData.type} - ${formData.severity} Priority`,
        type: 'Obstruction',
        priority: formData.severity,
        icon: 'alert-triangle',
        color: formData.severity === 'Critical' ? colors.orange :
               formData.severity === 'High' ? colors.red : colors.green,
        description: formData.notes || `${formData.type} reported via field app`,
        location: '-1.4061° S, 35.0117° E (Maasai Mara, Kenya)',
        hasPhoto: formData.hasPhoto,
        reportedBy: 'Field Ranger'
      };
      addAlert(alertData);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', `${currentConfig.title} submitted successfully!`);

      // Reset form
      setFormData({
        type: '',
        severity: '',
        species: 'Elephant',
        count: 1,
        notes: '',
        hasPhoto: false,
        hasLocation: true,
        additionalData: {}
      });
    }, 2000);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Render functions
  const renderStatusBar = () => (
    <View style={styles.statusBar}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.statusIcons}>
        <MaterialCommunityIcons name="signal" size={16} color="#000" />
        <MaterialCommunityIcons name="wifi" size={16} color="#000" style={{ marginLeft: 8 }} />
        <MaterialCommunityIcons name="battery" size={16} color="#000" style={{ marginLeft: 8 }} />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={20} color="#666" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{currentConfig.title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderReportTypeSwitcher = () => (
    <View style={styles.reportTypeSwitcher}>
      <View style={styles.switcherContainer}>
        {Object.entries(reportTypes).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            onPress={() => switchReportType(key)}
            style={[
              styles.switcherButton,
              currentReportType === key && styles.switcherButtonActive
            ]}
          >
            {config.icon === 'FileText' && <MaterialCommunityIcons name="file-document" size={16} color={currentReportType === key ? '#fff' : '#666'} />}
            {config.icon === 'AlertTriangle' && <MaterialCommunityIcons name="alert-triangle" size={16} color={currentReportType === key ? '#fff' : '#666'} />}
            {config.icon === 'Eye' && <MaterialCommunityIcons name="eye" size={16} color={currentReportType === key ? '#fff' : '#666'} />}
            <Text style={[
              styles.switcherButtonText,
              currentReportType === key && styles.switcherButtonTextActive
            ]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {renderStatusBar()}
      {renderHeader()}
      {renderReportTypeSwitcher()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selection with Wildlife Grid */}
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>
            {currentConfig.primaryField === 'species' ? 'Species' : 
             currentConfig.primaryField === 'type' ? 
             (currentReportType === 'obstruction' ? 'Obstruction Type' : 'Incident Type') : 
             'Selection'}
          </Text>
          
          {/* Wildlife Grid for species selection */}
          {currentConfig.hasSpecies && (
            <View style={styles.wildlifeGrid}>
              {currentConfig.types.slice(0, 4).map((animal) => (
                <TouchableOpacity
                  key={animal.name}
                  onPress={() => updateFormData('species', animal.name)}
                  style={[
                    styles.animalButton,
                    formData.species === animal.name && styles.animalButtonSelected
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={animal.icon} 
                    size={32} 
                    color={animal.iconColor}
                    style={styles.animalIcon}
                  />
                  <Text style={styles.animalName}>{animal.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Picker for all types */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currentConfig.hasSpecies ? formData.species : formData.type}
              onValueChange={(value) => updateFormData(currentConfig.hasSpecies ? 'species' : 'type', value)}
              style={styles.picker}
            >
              <Picker.Item 
                label={`Select ${currentConfig.primaryField}`} 
                value="" 
              />
              {currentConfig.types.map(item => (
                <Picker.Item
                  key={typeof item === 'string' ? item : item.name}
                  label={typeof item === 'string' ? item : `${item.name} - ${item.description}`}
                  value={typeof item === 'string' ? item : item.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Severity for Obstructions */}
        {currentConfig.hasSeverity && (
          <View style={styles.severityContainer}>
            <Text style={styles.label}>Severity Level</Text>
            {currentConfig.severityLevels.map(({ level, color, description }) => (
              <TouchableOpacity
                key={level}
                onPress={() => updateFormData('severity', level)}
                style={[
                  styles.severityButton,
                  { backgroundColor: color },
                  formData.severity === level && styles.severityButtonSelected
                ]}
              >
                <Text style={styles.severityLevel}>{level}</Text>
                <Text style={styles.severityDescription}>{description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Count for Wildlife */}
        {currentConfig.hasCount && (
          <View style={styles.countContainer}>
            <Text style={styles.label}>Count</Text>
            <View style={styles.countSelector}>
              <TouchableOpacity
                onPress={() => adjustCount(-1)}
                style={[styles.countButton, formData.count <= 0 && styles.countButtonDisabled]}
                disabled={formData.count <= 0}
              >
                <MaterialCommunityIcons name="minus" size={20} color={formData.count <= 0 ? '#ccc' : '#666'} />
              </TouchableOpacity>
              
              <View style={styles.countDisplay}>
                <TextInput
                  value={formData.count.toString()}
                  onChangeText={(text) => updateFormData('count', Math.max(0, parseInt(text) || 0))}
                  style={styles.countInput}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity
                onPress={() => adjustCount(1)}
                style={styles.countButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            value={formData.notes}
            onChangeText={(text) => updateFormData('notes', text)}
            placeholder={
              currentReportType === 'wildlife' ? 'Behavior, location details, group composition...' :
              currentReportType === 'obstruction' ? 'Additional obstruction details...' :
              'Enter detailed notes here...'
            }
            style={styles.notesInput}
          />
        </View>

        {/* Photo Button */}
        <TouchableOpacity
          onPress={() => updateFormData('hasPhoto', !formData.hasPhoto)}
          style={[
            styles.photoButton,
            formData.hasPhoto && styles.photoButtonSelected
          ]}
        >
          <MaterialCommunityIcons 
            name="camera" 
            size={24} 
            color={formData.hasPhoto ? '#10B981' : '#666'} 
          />
          <Text style={[
            styles.photoButtonText,
            formData.hasPhoto && styles.photoButtonTextSelected
          ]}>
            {formData.hasPhoto ? 'Photo Added (Optional)' : 'Add Photo (Optional)'}
          </Text>
        </TouchableOpacity>

        {/* Enhanced Map Preview */}
        <View style={styles.mapContainer}>
          <View style={styles.gpsRow}>
            <MaterialCommunityIcons name="earth" size={16} color="#059669" />
            <Text style={styles.gpsText}>
              GPS Tagged: -1.4061° S, 35.0117° E (Maasai Mara, Kenya)
            </Text>
          </View>
          <View style={styles.mapPreview}>
            {/* Realistic map background */}
            <View style={styles.mapBackground}>
              {/* Grid overlay */}
              <View style={styles.mapGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 12.5}%` }]} />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <View key={`v-${i}`} style={[styles.gridLineVertical, { left: `${i * 12.5}%` }]} />
                ))}
              </View>
              
              {/* Simulated landmarks */}
              <View style={[styles.landmark, { top: '20%', left: '15%', backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.landmark, { top: '70%', right: '20%', backgroundColor: '#F59E0B' }]} />
              <View style={[styles.landmark, { bottom: '15%', left: '30%', backgroundColor: '#EF4444' }]} />
              
              {/* User location with pulsing effect */}
              <View style={styles.locationMarker}>
                <View style={styles.locationPulse} />
                <View style={styles.locationDot} />
              </View>
              
              {/* Location label with better styling */}
              <View style={styles.locationLabel}>
                <View style={styles.locationLabelRow}>
                  <MaterialCommunityIcons name="binoculars" size={12} color="#FFFFFF" />
                  <Text style={styles.locationLabelText}>Your Location</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Form Summary */}
        {(formData.type || formData.species || formData.severity || formData.notes) && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Report Summary</Text>
            <View style={styles.summaryContent}>
              {formData.type && <Text style={styles.summaryItem}>• Type: {formData.type}</Text>}
              {formData.species && <Text style={styles.summaryItem}>• Species: {formData.species}</Text>}
              {formData.severity && <Text style={styles.summaryItem}>• Severity: {formData.severity}</Text>}
              {currentConfig.hasCount && <Text style={styles.summaryItem}>• Count: {formData.count}</Text>}
              <Text style={styles.summaryItem}>• Location: GPS Tagged</Text>
              {formData.hasPhoto && <Text style={styles.summaryItem}>• Photo: Attached</Text>}
              {formData.notes && (
                <Text style={styles.summaryItem}>
                  • Notes: {formData.notes.slice(0, 50)}{formData.notes.length > 50 ? '...' : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>
                Submitting {currentConfig.title}...
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {currentReportType === 'wildlife' ? 'Log Sighting' :
               currentReportType === 'obstruction' ? 'Report Obstruction' :
               'Save Report'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 64,
  },
  reportTypeSwitcher: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switcherContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  switcherButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 6,
  },
  switcherButtonActive: {
    backgroundColor: '#10B981',
  },
  switcherButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  switcherButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  wildlifeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  animalButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  animalButtonSelected: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  animalIcon: {
    marginBottom: 4,
  },
  animalName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  dropdownContainer: {
    marginBottom: 24,
  },
  pickerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
  },
  severityContainer: {
    marginBottom: 24,
  },
  severityButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  severityButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  severityLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  severityDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  countContainer: {
    marginBottom: 24,
  },
  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countButton: {
    width: 48,
    height: 48,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonDisabled: {
    opacity: 0.5,
  },
  countDisplay: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  countInput: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    width: '100%',
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 24,
    gap: 12,
  },
  photoButtonSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#10B981',
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  photoButtonTextSelected: {
    color: '#10B981',
  },
  mapContainer: {
    marginBottom: 24,
  },
  gpsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mapPreview: {
    height: 200,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#22543D',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#10B981',
    opacity: 0.2,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#10B981',
    opacity: 0.2,
  },
  landmark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  locationMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    zIndex: 10,
  },
  locationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
  locationDot: {
    width: 16,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    marginTop: 2,
    marginLeft: 2,
  },
  locationLabel: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    transform: [{ translateX: -50 }],
    borderWidth: 1,
    borderColor: '#374151',
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  summaryContent: {
    gap: 4,
  },
  summaryItem: {
    fontSize: 14,
    color: '#1d4ed8',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
