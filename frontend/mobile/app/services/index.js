// Central export file for all services
import api, { API_BASE_URL, checkServerHealth } from './api';
import auth from './auth';
import animals from './animals';
import tracking, { observations } from './tracking';
import predictions from './predictions';
import corridors from './corridors';
import conflictZones from './conflictZones';
import sync from './sync';
import offlineSync from './offlineSync';
import reports from './reports';
import rangers from './rangers';

export {
  api,
  API_BASE_URL,
  checkServerHealth,
  auth,
  animals,
  tracking,
  observations,
  predictions,
  corridors,
  conflictZones,
  sync,
  offlineSync,
  reports,
  rangers,
};

export default {
  api,
  auth,
  animals,
  tracking,
  observations,
  predictions,
  corridors,
  conflictZones,
  sync,
  offlineSync,
  reports,
  rangers,
};
