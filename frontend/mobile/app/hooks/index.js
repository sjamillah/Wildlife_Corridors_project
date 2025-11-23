// Central export for all custom hooks
export { useAuth } from './useAuth';
export { useAnimals, useLiveStatus } from './useAnimals';
export { useSync } from './useSync';
export { useWebSocket } from './useWebSocket';
export { useOfflineMode } from './useOfflineMode';
export { useOfflineGPS } from './useOfflineGPS';

// Default export to satisfy Expo Router (this is not a route, just an index file)
// Return a simple component that does nothing
const HooksIndex = () => null;
export default HooksIndex;
