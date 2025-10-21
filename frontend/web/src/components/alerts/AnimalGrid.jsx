import React from 'react';
import { MapPin, Clock, Navigation, Heart, Battery, Eye, Edit, Activity, Moon } from '@/components/shared/Icons';

const AnimalGrid = ({ animals, onAnimalSelect }) => {
  return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {animals.map((animal) => (
        <div
          key={animal.id}
          onClick={() => onAnimalSelect(animal)}
              className="bg-brand-card rounded-lg shadow border border-brand-card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
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
                {React.createElement(animal.icon, { className: "w-12 h-12 text-brand-earth" })}
                <div>
                  <h3 className="font-bold text-brand-text text-xl sm:text-2xl group-hover:text-brand-primary transition">{animal.name}</h3>
                  <p className="text-base text-brand-text-secondary">{animal.species}</p>
                  <p className="text-sm text-brand-text-secondary font-mono">{animal.id}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-base font-semibold flex items-center space-x-2">
                {animal.status === 'Moving' && <Activity className="w-5 h-5 text-brand-primary" />}
                {animal.status === 'Resting' && <Moon className="w-5 h-5 text-brand-earth" />}
                {animal.status === 'Feeding' && <Heart className="w-5 h-5 text-brand-moss" />}
                <span className="text-lg">{animal.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-brand-surface rounded-lg p-3 border border-brand-border">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  <span className="text-sm text-brand-primary font-semibold">Location</span>
                </div>
                <p className="text-base font-bold text-brand-text truncate">{animal.location}</p>
              </div>
              <div className="bg-brand-surface rounded-lg p-3 border border-brand-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-5 h-5 text-brand-primary" />
                  <span className="text-sm text-brand-primary font-semibold">Last Seen</span>
                </div>
                <p className="text-base font-bold text-brand-text">{animal.lastSeen}</p>
              </div>
              <div className="bg-brand-surface rounded-lg p-3 border border-brand-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Navigation className="w-5 h-5 text-brand-primary" />
                  <span className="text-sm text-brand-primary font-semibold">Speed</span>
                </div>
                <p className="text-base font-bold text-brand-text">{animal.speed} km/h</p>
              </div>
              <div className="bg-brand-surface rounded-lg p-3 border border-brand-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Heart className="w-5 h-5 text-brand-primary" />
                  <span className="text-sm text-brand-primary font-semibold">Health</span>
                </div>
                <p className={`text-base font-bold ${
                  animal.health === 'Excellent' ? 'text-brand-primary' :
                  animal.health === 'Good' ? 'text-brand-primary' :
                  'text-orange-600'
                }`}>{animal.health}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-primary font-semibold flex items-center space-x-1">
                  <Battery className="w-5 h-5 text-brand-primary" />
                  <span>Collar Battery</span>
                </span>
                <span className="text-base font-bold text-brand-text">{animal.battery}%</span>
              </div>
              <div className="w-full bg-brand-surface rounded-full h-2 border border-brand-border">
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
              <button className="flex-1 bg-brand-primary hover:bg-brand-earth text-white py-3 rounded-xl text-lg font-bold transition flex items-center justify-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Track Live</span>
              </button>
              <button className="px-5 py-3 border-2 border-brand-moss hover:border-brand-primary rounded-xl transition">
                <Edit className="w-5 h-5 text-brand-primary" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnimalGrid;