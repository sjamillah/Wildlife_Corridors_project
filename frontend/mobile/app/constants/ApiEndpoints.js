/**
 * API Endpoints Constants
 * Central location for all backend API endpoints
 */

export const AUTH_ENDPOINTS = {
  REGISTER: '/api/v1/auth/register/',
  VERIFY_OTP: '/api/v1/auth/verify-otp/',
  LOGIN: '/api/v1/auth/login/',
  LOGIN_VERIFY: '/api/v1/auth/login/verify/',
  LOGOUT: '/api/v1/auth/logout/',
  REFRESH: '/api/v1/auth/refresh/',
  ME: '/api/v1/auth/me/',
  CHANGE_PASSWORD: '/api/v1/auth/change-password/',
};

export const ANIMALS_ENDPOINTS = {
  BASE: '/api/v1/animals/',
  DETAIL: (id) => `/api/v1/animals/${id}/`,
  LIVE_STATUS: '/api/v1/animals/live_status/',
};

export const TRACKING_ENDPOINTS = {
  BASE: '/api/v1/tracking/',
  DETAIL: (id) => `/api/v1/tracking/${id}/`,
  LIVE: '/api/v1/tracking/live/',
  LIVE_TRACKING: '/api/v1/tracking/live_tracking/',
  OBSERVATIONS: '/api/v1/tracking/observations/',
  OBSERVATION_DETAIL: (id) => `/api/v1/tracking/observations/${id}/`,
};

export const PREDICTIONS_ENDPOINTS = {
  BASE: '/api/v1/predictions/',
  DETAIL: (id) => `/api/v1/predictions/${id}/`,
  CORRIDOR: '/api/v1/predictions/corridor/',
  HISTORY: '/api/v1/predictions/history/',
};

export const CORRIDORS_ENDPOINTS = {
  BASE: '/api/v1/corridors/',
  DETAIL: (id) => `/api/v1/corridors/${id}/`,
  OPTIMIZE: '/api/v1/corridors/optimize/',
};

export const CONFLICT_ZONES_ENDPOINTS = {
  BASE: '/api/v1/conflict-zones/',
  DETAIL: (id) => `/api/v1/conflict-zones/${id}/`,
  GEOJSON: '/api/v1/conflict-zones/geojson/',
};

export const SYNC_ENDPOINTS = {
  LOGS: '/api/v1/sync/logs/',
  LOG_DETAIL: (id) => `/api/v1/sync/logs/${id}/`,
  RECENT: '/api/v1/sync/logs/recent/',
  STATS: '/api/v1/sync/logs/stats/',
  QUEUE: '/api/v1/sync/queue/',
  QUEUE_DETAIL: (id) => `/api/v1/sync/queue/${id}/`,
  PENDING: '/api/v1/sync/queue/pending/',
  FAILED: '/api/v1/sync/queue/failed/',
  RETRY_FAILED: '/api/v1/sync/queue/retry_failed/',
  RETRY_ITEM: (id) => `/api/v1/sync/queue/${id}/retry_item/`,
  UPLOAD: '/api/v1/sync/upload/',
};

export const CORE_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health/',
  ADMIN: '/admin/',
  DOCS: '/api/docs/',
  REDOC: '/api/redoc/',
};

// User roles
export const USER_ROLES = {
  FIELD_OFFICER: 'field_officer',
  RESEARCHER: 'researcher',
  ADMIN: 'admin',
};

// Animal species
export const ANIMAL_SPECIES = [
  'elephant',
  'lion',
  'leopard',
  'cheetah',
  'rhino',
  'buffalo',
  'giraffe',
  'zebra',
  'wildebeest',
  'other',
];

// Animal status
export const ANIMAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RELOCATED: 'relocated',
  DECEASED: 'deceased',
};

// Observation types
export const OBSERVATION_TYPES = {
  BEHAVIOR: 'behavior',
  HABITAT: 'habitat',
  HEALTH: 'health',
  INTERACTION: 'interaction',
  OTHER: 'other',
};

// Prediction types
export const PREDICTION_TYPES = {
  CORRIDOR: 'corridor',
  MOVEMENT: 'movement',
  BEHAVIOR: 'behavior',
  HABITAT: 'habitat',
};

// RL algorithms
export const RL_ALGORITHMS = {
  PPO: 'ppo',
  A2C: 'a2c',
  DQN: 'dqn',
};

// Corridor status
export const CORRIDOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PROPOSED: 'proposed',
  DEPRECATED: 'deprecated',
};

// Sync item types
export const SYNC_ITEM_TYPES = {
  TRACKING: 'tracking',
  OBSERVATION: 'observation',
  ANIMAL: 'animal',
};

// API response codes
export const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export default {
  AUTH_ENDPOINTS,
  ANIMALS_ENDPOINTS,
  TRACKING_ENDPOINTS,
  PREDICTIONS_ENDPOINTS,
  CORRIDORS_ENDPOINTS,
  CONFLICT_ZONES_ENDPOINTS,
  SYNC_ENDPOINTS,
  CORE_ENDPOINTS,
  USER_ROLES,
  ANIMAL_SPECIES,
  ANIMAL_STATUS,
  OBSERVATION_TYPES,
  PREDICTION_TYPES,
  RL_ALGORITHMS,
  CORRIDOR_STATUS,
  SYNC_ITEM_TYPES,
  API_RESPONSE_CODES,
};


