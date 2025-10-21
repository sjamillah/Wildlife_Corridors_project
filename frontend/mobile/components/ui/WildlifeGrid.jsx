import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function WildlifeGrid({ types, selectedSpecies, onSelect }) {
  if (!types || !Array.isArray(types)) return null;

  return (
    <View className="flex-row gap-3 mb-4">
      {types.slice(0, 4).map((animal) => (
        <TouchableOpacity
          key={animal.name}
          onPress={() => onSelect(animal.name)}
          className={`flex-1 aspect-square rounded-lg items-center justify-center p-2 border-2 ${
            selectedSpecies === animal.name
              ? 'bg-brand-secondary border-brand-primary'
              : 'bg-gray-100 border-gray-200'
          }`}
        >
          <Text className="text-2xl mb-1">{animal.icon}</Text>
          <Text className={`text-xs font-medium text-center ${
            selectedSpecies === animal.name ? 'text-brand-primary' : 'text-gray-700'
          }`}>
            {animal.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}