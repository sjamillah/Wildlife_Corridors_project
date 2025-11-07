// Central export file for all services
import api, { API_BASE_URL, checkServerHealth } from './api';
import auth from './auth';
import animals from './animals';
import tracking, { observations } from './tracking';
import predictions from './predictions';
import corridors from './corridors';
import reports from './reports';
import conflictZones from './conflictZones';
import rangers from './rangers';
import alerts from './alerts';
import behavior from './behavior';
import IntegrationCheck from './integration-check';

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
  reports,
  conflictZones,
  rangers,
  alerts,
  behavior,
  IntegrationCheck,
};

const services = {
  api,
  auth,
  animals,
  tracking,
  observations,
  predictions,
  corridors,
  reports,
  conflictZones,
  rangers,
  alerts,
  behavior,
  IntegrationCheck,
};

export default services;


