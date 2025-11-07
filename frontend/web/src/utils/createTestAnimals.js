import { animals } from '../services';

// Test animals data for different species
const testAnimals = [
  {
    collar_id: "ELE001",
    species: "African Elephant",
    name: "Tusker",
    status: "active",
    last_known_location: "Maasai Mara National Reserve, Kenya",
    last_lat: -1.4100,
    last_lon: 35.0200,
    collar_battery: 85,
    health_status: "Good",
    age: 15,
    gender: "Male",
    risk_level: "Low"
  },
  {
    collar_id: "ELE002",
    species: "African Elephant",
    name: "Matriarch Maya",
    status: "active",
    last_known_location: "Amboseli National Park, Kenya",
    last_lat: -2.1540,
    last_lon: 36.7073,
    collar_battery: 92,
    health_status: "Excellent",
    age: 35,
    gender: "Female",
    risk_level: "Low"
  },
  {
    collar_id: "LION001",
    species: "Lion",
    name: "Simba",
    status: "active",
    last_known_location: "Serengeti National Park, Tanzania",
    last_lat: -2.3333,
    last_lon: 34.8333,
    collar_battery: 67,
    health_status: "Good",
    age: 8,
    gender: "Male",
    risk_level: "Medium"
  },
  {
    collar_id: "RHINO001",
    species: "Black Rhino",
    name: "Thunder",
    status: "active",
    last_known_location: "Ngorongoro Crater, Tanzania",
    last_lat: -3.2167,
    last_lon: 35.7500,
    collar_battery: 78,
    health_status: "Good",
    age: 12,
    gender: "Male",
    risk_level: "High"
  },
  {
    collar_id: "GIRA001",
    species: "Giraffe",
    name: "Grace",
    status: "active",
    last_known_location: "Nairobi National Park, Kenya",
    last_lat: -0.0236,
    last_lon: 37.9062,
    collar_battery: 88,
    health_status: "Excellent",
    age: 6,
    gender: "Female",
    risk_level: "Low"
  },
  {
    collar_id: "WILDE001",
    species: "Wildebeest",
    name: "Wanderer",
    status: "active",
    last_known_location: "Migration Corridor, Kenya-Tanzania Border",
    last_lat: -2.0000,
    last_lon: 35.5000,
    collar_battery: 55,
    health_status: "Fair",
    age: 4,
    gender: "Male",
    risk_level: "Medium"
  }
];

/**
 * Create test animals in the database
 * Call this from browser console: createTestAnimals()
 */
export const createTestAnimals = async () => {
  console.log('Creating test animals...');
  const results = [];
  
  for (const animalData of testAnimals) {
    try {
      const created = await animals.create(animalData);
      console.log(`Created: ${animalData.name} (${animalData.species})`);
      results.push({ success: true, animal: created });
    } catch (error) {
      console.error(`Failed to create ${animalData.name}:`, error.message);
      results.push({ success: false, error: error.message, animal: animalData });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nSummary: ${successful} created, ${failed} failed`);
  return results;
};

/**
 * Delete all test animals
 * Call this from browser console: deleteTestAnimals()
 */
export const deleteTestAnimals = async () => {
  console.log('Fetching all animals...');
  const allAnimals = await animals.getAll();
  const animalsList = allAnimals.results || allAnimals || [];
  
  console.log(`Found ${animalsList.length} animals. Deleting...`);
  const results = [];
  
  for (const animal of animalsList) {
    try {
      await animals.delete(animal.id);
      console.log(`Deleted: ${animal.name}`);
      results.push({ success: true, animal });
    } catch (error) {
      console.error(`Failed to delete ${animal.name}:`, error.message);
      results.push({ success: false, error: error.message, animal });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nSummary: ${successful} deleted, ${failed} failed`);
  return results;
};

// Make functions available globally in dev mode
if (process.env.NODE_ENV === 'development') {
  window.createTestAnimals = createTestAnimals;
  window.deleteTestAnimals = deleteTestAnimals;
}

const testAnimalsService = { createTestAnimals, deleteTestAnimals };

export default testAnimalsService;

