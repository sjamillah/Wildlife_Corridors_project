import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from './IconSymbol';

export function CountSelector({ count, onAdjust, onDirectChange }) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3">Count</Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => onAdjust(-1)}
          disabled={count <= 0}
          className={`w-12 h-12 bg-gray-100 rounded-lg items-center justify-center ${
            count <= 0 ? 'opacity-50' : ''
          }`}
        >
          <IconSymbol 
            name="minus" 
            size={20} 
            color={count <= 0 ? '#ccc' : '#666'} 
          />
        </TouchableOpacity>
        
        <View className="flex-1 bg-gray-100 rounded-lg p-4 items-center">
          <TextInput
            value={count.toString()}
            onChangeText={onDirectChange}
            className="text-lg font-semibold text-gray-900 text-center w-full"
            keyboardType="numeric"
          />
        </View>
        
        <TouchableOpacity
          onPress={() => onAdjust(1)}
          className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center"
        >
          <IconSymbol name="plus" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}