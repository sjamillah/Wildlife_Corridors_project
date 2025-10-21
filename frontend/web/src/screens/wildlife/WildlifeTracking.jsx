import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin } from '@/components/shared/Icons';
import { GiElephant, GiBuffaloHead } from 'react-icons/gi';
import Sidebar from '../../components/shared/Sidebar';
import { WildlifeHeader } from '../../components/shared/HeaderVariants';
import StatsBar from '../../components/alerts/StatsBar';
import FilterTabs from '../../components/alerts/FilterTabs';
import TrackingMap from '../../components/alerts/TrackingMap';
import AnimalGrid from '../../components/alerts/AnimalGrid';
import DetailModal from '../../components/alerts/DetailModal';
import { isAllowedSpecies } from '../../constants/Animals';

const WildlifeTracking = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [animals, setAnimals] = useState([
    { 
      id: 'KWS-E12', 
      species: 'African Elephant', 
      name: 'Nafisa (Matriarch)', 
      status: 'Moving', 
      location: 'Kimana Corridor', 
      coordinates: [34.8532, -2.0891],
      battery: 85, 
      lastSeen: '10 min ago', 
      risk: 'High',
      age: '18 years',
      gender: 'Female',
      health: 'Good',
      speed: 2.3,
      collarDate: '2023-08-15',
  icon: GiElephant,
      movementHistory: [
        [34.8432, -2.0991],
        [34.8482, -2.0941],
        [34.8532, -2.0891]
      ]
    },
    { 
      id: 'KWS-E08', 
      species: 'African Elephant', 
      name: 'Bomani (Bull)', 
      status: 'Feeding', 
      location: 'Mara River', 
      coordinates: [34.8721, -2.1145],
      battery: 92, 
      lastSeen: '5 min ago', 
      risk: 'Medium',
      age: '25 years',
      gender: 'Male',
      health: 'Excellent',
      speed: 1.2,
      collarDate: '2023-09-20',
  icon: GiElephant,
      movementHistory: [
        [34.8621, -2.1245],
        [34.8671, -2.1195],
        [34.8721, -2.1145]
      ]
    },
    { 
      id: 'KWS-E15', 
      species: 'African Elephant', 
      name: 'Temba (Young Bull)', 
      status: 'Moving', 
      location: 'Acacia Plains', 
      coordinates: [34.8234, -2.0789],
      battery: 78, 
      lastSeen: '18 min ago', 
      risk: 'Low',
      age: '12 years',
      gender: 'Male',
      health: 'Good',
      speed: 3.1,
      collarDate: '2024-01-15',
  icon: GiElephant,
      movementHistory: [
        [34.8134, -2.0889],
        [34.8184, -2.0839],
        [34.8234, -2.0789]
      ]
    },
    {
      id: 'WB-001',
      species: 'Wildebeest',
      name: 'Herd Alpha',
      status: 'Moving',
      location: 'Migration Route North',
      coordinates: [34.81, -2.1],
      battery: 76,
      lastSeen: '5 min ago',
      risk: 'Medium',
      age: 'Herd (150 individuals)',
      gender: 'Mixed',
      health: 'Good',
      speed: 6.2,
      collarDate: '2024-02-10',
  icon: GiBuffaloHead,
      movementHistory: [
        [34.805, -2.105],
        [34.8075, -2.1025],
        [34.81, -2.1]
      ]
    },
    {
      id: 'WB-003',
      species: 'Wildebeest',
      name: 'Herd Beta',
      status: 'Grazing',
      location: 'Musiara Marsh',
      coordinates: [34.8445, -2.0656],
      battery: 88,
      lastSeen: '12 min ago',
      risk: 'Low',
      age: 'Herd (230 individuals)',
      gender: 'Mixed',
      health: 'Excellent',
      speed: 0.8,
      collarDate: '2024-03-05',
  icon: GiBuffaloHead,
      movementHistory: [
        [34.8345, -2.0756],
        [34.8395, -2.0706],
        [34.8445, -2.0656]
      ]
    },
    {
      id: 'WB-007',
      species: 'Wildebeest',
      name: 'Herd Gamma',
      status: 'Moving',
      location: 'Crossing Point Delta',
      coordinates: [34.7956, -2.0934],
      battery: 65,
      lastSeen: '25 min ago',
      risk: 'High',
      age: 'Herd (85 individuals)',
      gender: 'Mixed',
      health: 'Monitoring',
      speed: 8.5,
      collarDate: '2023-12-18',
  icon: GiBuffaloHead,
      movementHistory: [
        [34.7856, -2.1034],
        [34.7906, -2.0984],
        [34.7956, -2.0934]
      ]
    }
  ]);

  // Simulate real-time movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimals(prev => prev.map(animal => {
        if (animal.status === 'Moving') {
          const newLng = animal.coordinates[0] + (Math.random() - 0.5) * 0.003;
          const newLat = animal.coordinates[1] + (Math.random() - 0.5) * 0.003;
          return {
            ...animal,
            coordinates: [newLng, newLat],
            movementHistory: [...animal.movementHistory.slice(-2), [newLng, newLat]]
          };
        }
        return animal;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Refreshing wildlife data...');
  };

  const speciesCount = {
    all: animals.length,
    elephant: animals.filter(a => a.species.includes('Elephant')).length,
    wildebeest: animals.filter(a => a.species.includes('Wildebeest')).length
  };

  // Only show allowed species (Elephant, Wildebeest) by default
  const visibleAnimals = animals.filter(a => isAllowedSpecies(a.species));

  const filteredAnimals = filterSpecies === 'all' 
    ? visibleAnimals 
    : animals.filter(a => a.species.toLowerCase().includes(filterSpecies.toLowerCase()));

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <WildlifeHeader animals={animals} onRefresh={handleRefresh} />
        
        <div className="flex-1 overflow-y-auto">
          <StatsBar animals={animals} />

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="animate-fade-in">
              <FilterTabs 
                filterSpecies={filterSpecies}
                setFilterSpecies={setFilterSpecies}
                speciesCount={speciesCount}
              />
            </div>

            <div className="mt-4 sm:mt-6 animate-slide-up">
              <TrackingMap 
                animals={filteredAnimals}
                onAnimalSelect={setSelectedAnimal}
              />
            </div>

            <div className="mt-4 sm:mt-6 animate-fade-in">
              <AnimalGrid 
                animals={filteredAnimals}
                onAnimalSelect={setSelectedAnimal}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedAnimal && (
        <DetailModal 
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
};

export default WildlifeTracking;