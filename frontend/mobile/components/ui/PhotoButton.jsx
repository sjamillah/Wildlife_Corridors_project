import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';

export function PhotoButton({ hasPhoto, onToggle }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`flex-row items-center justify-center p-4 rounded-lg border-2 gap-3 mb-6 ${
        hasPhoto
          ? 'bg-emerald-50 border-emerald-500'
          : 'bg-gray-100 border-gray-200'
      }`}
    >
      <IconSymbol 
        name="camera" 
        size={24} 
        color={hasPhoto ? '#10B981' : '#666'} 
      />
      <Text className={`text-lg font-medium ${
        hasPhoto ? 'text-emerald-600' : 'text-gray-600'
      }`}>
        {hasPhoto ? 'Photo Added (Optional)' : 'Add Photo (Optional)'}
      </Text>
    </TouchableOpacity>
  );
}