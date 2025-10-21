import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';

export function ReportTypeSwitch({ reportTypes, currentReportType, onSwitch }) {
  return (
    <View className="flex-row bg-white border-b border-gray-200 px-4 py-3">
      <View className="flex-row gap-2 flex-1">
        {Object.entries(reportTypes).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            onPress={() => onSwitch(key)}
            className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-lg gap-1.5 ${
              currentReportType === key 
                ? 'bg-brand-primary' 
                : 'bg-gray-100'
            }`}
          >
            <IconSymbol 
              name={config.icon} 
              size={16} 
              color={currentReportType === key ? '#ffffff' : '#666666'} 
            />
            <Text className={`text-sm font-medium ${
              currentReportType === key ? 'text-white' : 'text-gray-600'
            }`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}