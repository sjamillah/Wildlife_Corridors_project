import React from 'react';
import { View, Text } from 'react-native';

export function MapPreview({ gpsLocation }) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        GPS Tagged: {gpsLocation || '-1.9441° S, 30.0619° E (Kigali, Rwanda)'}
      </Text>
      <View className="h-50 bg-brand-accent rounded-lg relative overflow-hidden">
        {/* Grid lines */}
        <View className="absolute inset-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <View 
              key={i} 
              className="h-1/6 border-b border-brand-accent opacity-30" 
            />
          ))}
        </View>
        
        {/* Location marker */}
        <View className="absolute top-1/2 left-1/2 -mt-2 -ml-2">
          <View className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
        </View>
        
        {/* Location label */}
        <View className="absolute top-1/4 left-1/2 -ml-16 bg-amber-400 px-2 py-1 rounded">
          <Text className="text-xs font-semibold text-black">
            Your GPS location
          </Text>
        </View>
      </View>
    </View>
  );
}