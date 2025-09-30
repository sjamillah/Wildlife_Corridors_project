import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function SeveritySelector({ severityLevels, selectedSeverity, onSelect }) {
  if (!severityLevels) return null;

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Severity Level
      </Text>
      <View className="gap-3">
        {severityLevels.map(({ level, color, description }) => (
          <TouchableOpacity
            key={level}
            onPress={() => onSelect(level)}
            className={`p-4 rounded-lg border-2 ${
              selectedSeverity === level 
                ? 'border-white border-opacity-50 shadow-lg' 
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          >
            <Text className="text-lg font-bold text-white mb-1">{level}</Text>
            <Text className="text-sm text-white opacity-90">{description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}