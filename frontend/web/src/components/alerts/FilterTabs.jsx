import React from 'react';
import { Search, Globe } from 'lucide-react';
import { 
  GiElephant,
  GiBuffaloHead
} from 'react-icons/gi';

const FilterTabs = ({ filterSpecies, setFilterSpecies, speciesCount }) => {
  const tabs = [
    { key: 'all', label: 'All Species', count: speciesCount.all, icon: Globe },
    { key: 'elephant', label: 'Elephants', count: speciesCount.elephant, icon: GiElephant },
    { key: 'wildebeest', label: 'Wildebeests', count: speciesCount.wildebeest, icon: GiBuffaloHead }
  ];

  return (
    <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, species, or location..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
          />
        </div>
      </div>
      
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterSpecies(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition ${
              filterSpecies === tab.key
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-sm">{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              filterSpecies === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterTabs;