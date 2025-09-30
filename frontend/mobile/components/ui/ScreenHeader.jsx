import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';

export function ScreenHeader({ title, onBack, showBack = true }) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
      {showBack ? (
        <TouchableOpacity 
          onPress={onBack}
          className="flex-row items-center"
        >
          <IconSymbol name="chevron.left" size={20} color="#666" />
          <Text className="ml-2 text-base text-gray-600">Back</Text>
        </TouchableOpacity>
      ) : (
        <View className="w-16" />
      )}
      
      <Text className="flex-1 text-center text-lg font-semibold text-black">
        {title}
      </Text>
      <View className="w-16" />
    </View>
  );
}