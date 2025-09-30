import React from 'react';
import { View, Text } from 'react-native';

export function FormSummary({ formData, currentConfig }) {
  const hasData = formData.type || formData.species || formData.severity || formData.notes;
  
  if (!hasData) return null;

  return (
    <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <Text className="text-base font-semibold text-blue-700 mb-2">
        Report Summary
      </Text>
      <View className="gap-1">
        {formData.type && (
          <Text className="text-sm text-blue-600">• Type: {formData.type}</Text>
        )}
        {formData.species && (
          <Text className="text-sm text-blue-600">• Species: {formData.species}</Text>
        )}
        {formData.severity && (
          <Text className="text-sm text-blue-600">• Severity: {formData.severity}</Text>
        )}
        {currentConfig.hasCount && (
          <Text className="text-sm text-blue-600">• Count: {formData.count}</Text>
        )}
        <Text className="text-sm text-blue-600">• Location: GPS Tagged</Text>
        {formData.hasPhoto && (
          <Text className="text-sm text-blue-600">• Photo: Attached</Text>
        )}
        {formData.notes && (
          <Text className="text-sm text-blue-600">
            • Notes: {formData.notes.slice(0, 50)}{formData.notes.length > 50 ? '...' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}