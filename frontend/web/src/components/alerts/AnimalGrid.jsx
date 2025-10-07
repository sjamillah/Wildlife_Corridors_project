import React from 'react';
import { MapPin, Clock, Navigation, Heart, Battery, Eye, Edit, Activity, Moon } from 'lucide-react';

const AnimalGrid = ({ animals, onAnimalSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {animals.map((animal) => (
        <div
          key={animal.id}
          onClick={() => onAnimalSelect(animal)}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group"
        >
          <div className={`h-2 ${
            animal.risk === 'Critical' ? 'bg-red-500' : 
            animal.risk === 'High' ? 'bg-orange-500' : 
            animal.risk === 'Medium' ? 'bg-yellow-500' : 
            'bg-brand-moss'
          }`} />

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {React.createElement(animal.icon, { className: "w-10 h-10 text-brand-earth" })}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition">{animal.name}</h3>
                  <p className="text-sm text-gray-500">{animal.species}</p>
                  <p className="text-xs text-gray-400 font-mono">{animal.id}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-2">
                {animal.status === 'Moving' && <Activity className="w-4 h-4 text-brand-primary" />}
                {animal.status === 'Resting' && <Moon className="w-4 h-4 text-brand-earth" />}
                {animal.status === 'Feeding' && <Heart className="w-4 h-4 text-brand-moss" />}
                <span className="text-sm text-gray-700">{animal.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-brand-primary font-medium">Location</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{animal.location}</p>
              </div>
              <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-brand-primary font-medium">Last Seen</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{animal.lastSeen}</p>
              </div>
              <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                <div className="flex items-center space-x-2 mb-1">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-brand-primary font-medium">Speed</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{animal.speed} km/h</p>
              </div>
              <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                <div className="flex items-center space-x-2 mb-1">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-brand-primary font-medium">Health</span>
                </div>
                <p className={`text-sm font-semibold ${
                  animal.health === 'Excellent' ? 'text-green-600' :
                  animal.health === 'Good' ? 'text-emerald-600' :
                  'text-orange-600'
                }`}>{animal.health}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  <span>Collar Battery</span>
                </span>
                <span className="text-xs font-bold text-gray-900">{animal.battery}%</span>
              </div>
              <div className="w-full bg-brand-accent rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    animal.battery > 50 ? 'bg-brand-primary' : 
                    animal.battery > 20 ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${animal.battery}%` }}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 bg-brand-primary hover:bg-brand-earth text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Track Live</span>
              </button>
              <button className="px-4 py-2.5 border-2 border-brand-moss hover:border-brand-primary rounded-xl transition">
                <Edit className="w-4 h-4 text-brand-primary" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnimalGrid;