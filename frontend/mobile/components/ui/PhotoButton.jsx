import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { STATUS_COLORS, BRAND_COLORS } from '../../constants/Colors';

export function PhotoButton({ hasPhoto, onToggle }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`flex-row items-center justify-center p-4 rounded-lg border-2 gap-3 mb-6 ${
        hasPhoto
          ? 'bg-brand-secondary border-brand-primary'
          : 'bg-gray-100 border-gray-200'
      }`}
    >
      <IconSymbol 
        name="camera" 
        size={24} 
        color={hasPhoto ? BRAND_COLORS.PRIMARY : '#666'} 
      />
      <Text className={`text-lg font-medium ${
        hasPhoto ? 'text-brand-primary' : 'text-gray-600'
      }`}>
        {hasPhoto ? 'Photo Added (Optional)' : 'Add Photo (Optional)'}
      </Text>
    </TouchableOpacity>
  );
}