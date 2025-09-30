import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WildlifeGrid } from './WildlifeGrid';

export function TypeSelector({ 
  config, 
  selectedType, 
  selectedSpecies, 
  onTypeSelect, 
  onSpeciesSelect 
}) {
  const fieldName = config.primaryField === 'species' ? 'Species' : 
                   config.primaryField === 'type' ? 
                   (config.title.includes('Obstruction') ? 'Obstruction Type' : 'Incident Type') : 
                   'Selection';

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        {fieldName}
      </Text>
      
      {config.hasSpecies && (
        <WildlifeGrid
          types={config.types}
          selectedSpecies={selectedSpecies}
          onSelect={onSpeciesSelect}
        />
      )}
      
      <View className="gap-2">
        {config.types.map(item => {
          const itemName = typeof item === 'string' ? item : item.name;
          const isSelected = config.hasSpecies ? 
            selectedSpecies === itemName : 
            selectedType === itemName;
          
          return (
            <TouchableOpacity
              key={itemName}
              onPress={() => config.hasSpecies ? onSpeciesSelect(itemName) : onTypeSelect(itemName)}
              className={`flex-row items-center justify-between p-4 rounded-lg border ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text className={`flex-1 text-base ${
                isSelected ? 'text-emerald-600' : 'text-gray-700'
              }`}>
                {typeof item === 'string' ? item : `${item.name} - ${item.description}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}