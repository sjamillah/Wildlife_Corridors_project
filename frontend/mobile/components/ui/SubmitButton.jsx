import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

export function SubmitButton({ 
  onSubmit, 
  isSubmitting, 
  currentReportType, 
  config,
  disabled = false 
}) {
  const getButtonText = () => {
    if (isSubmitting) return `Submitting ${config.title}...`;
    if (currentReportType === 'wildlife') return 'Log Sighting';
    if (currentReportType === 'obstruction') return 'Report Obstruction';
    return 'Save Report';
  };

  return (
    <TouchableOpacity
      onPress={onSubmit}
      disabled={isSubmitting || disabled}
      className={`py-4 rounded-lg items-center justify-center mb-8 ${
        isSubmitting || disabled 
          ? 'bg-gray-400' 
          : 'bg-brand-primary'
      }`}
    >
      {isSubmitting ? (
        <View className="flex-row items-center">
          <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-lg font-semibold text-white">
            {getButtonText()}
          </Text>
        </View>
      ) : (
        <Text className="text-lg font-semibold text-white">
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  );
}