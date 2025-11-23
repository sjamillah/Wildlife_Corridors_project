/**
 * Checkpoint Check-in Component
 * Allows rangers to manually check in at waypoints
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import rangerTrackingService from '@services/rangerTracking';

const CheckpointCheckIn = ({ onCheckInSuccess, onClose }) => {
  const [waypointName, setWaypointName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);

  const handleCheckIn = async () => {
    if (!waypointName.trim() && !notes.trim()) {
      Alert.alert('Error', 'Please enter a waypoint name or notes');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await rangerTrackingService.createCheckpoint({
        waypointName: waypointName.trim() || 'Quick Check-in',
        notes: notes.trim(),
        photoUrl: photo,
      });

      if (result.synced) {
        Alert.alert('Success', 'Checkpoint recorded');
      } else {
        Alert.alert('Saved Offline', 'Checkpoint will sync when online');
      }

      // Reset form
      setWaypointName('');
      setNotes('');
      setPhoto(null);

      onCheckInSuccess?.();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create checkpoint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCheckIn = async () => {
    setWaypointName('Quick Check-in');
    await handleCheckIn();
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkpoint Check-in</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={BRAND_COLORS.TEXT} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Waypoint Name</Text>
          <TextInput
            placeholder="e.g., Water Point Alpha"
            value={waypointName}
            onChangeText={setWaypointName}
            style={styles.input}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            placeholder="Additional information..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photo (Optional)</Text>
          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                onPress={handleRemovePhoto}
                style={styles.removePhotoButton}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color={STATUS_COLORS.ERROR} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={styles.photoButton}
              disabled={isSubmitting}
            >
              <MaterialCommunityIcons name="camera" size={24} color={BRAND_COLORS.PRIMARY} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.quickButton]}
            onPress={handleQuickCheckIn}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="flash" size={20} color={BRAND_COLORS.SURFACE} />
            <Text style={styles.quickButtonText}>Quick Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCheckIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={BRAND_COLORS.SURFACE} />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color={BRAND_COLORS.SURFACE} />
                <Text style={styles.primaryButtonText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: BRAND_COLORS.TEXT,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.PRIMARY,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  quickButton: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.PRIMARY,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
});

export default CheckpointCheckIn;

