/**
 * Wildlife Corridors App - Icon Configuration
 * Centralized icon names and mappings for consistency across the app
 */

export const WILDLIFE_ICONS = {
  // Animals
  ELEPHANT: 'elephant',
  LION: 'google-circles-communities', // Closest to pride/group
  RHINO: 'rhombus',
  GIRAFFE: 'giraffe',
  ZEBRA: 'horse',
  BUFFALO: 'cow',
  LEOPARD: 'cat',
  CHEETAH: 'speedometer',
  WILDEBEEST: 'cow',
  HIPPO: 'water',
  CROCODILE: 'snake',
  HYENA: 'dog',
  BIRD: 'bird',
  GENERIC_ANIMAL: 'paw',
  ANIMAL_TRACKS: 'shoe-print',
  
  // Conservation & Wildlife
  TREE: 'pine-tree',
  FOREST: 'forest',
  WATER: 'water',
  MOUNTAIN: 'image-filter-hdr',
  PLANT: 'leaf',
  FLOWER: 'flower',
  CAMERA_TRAP: 'camera',
  BINOCULARS: 'binoculars',
  
  // Alerts & Warnings
  ALERT: 'alert',
  ALERT_CIRCLE: 'alert-circle',
  ALERT_OCTAGON: 'alert-octagon',
  WARNING: 'alert',
  DANGER: 'alert',
  CRITICAL: 'alert-octagon',
  INFO: 'information',
  SUCCESS: 'check-circle',
  ERROR: 'close-circle',
  
  // Navigation & Location
  MAP: 'map',
  MAP_MARKER: 'map-marker',
  MAP_MARKER_CIRCLE: 'map-marker-circle',
  MAP_MARKER_ALERT: 'map-marker-alert',
  LOCATION: 'crosshairs-gps',
  COMPASS: 'compass',
  GPS: 'crosshairs-gps',
  NAVIGATION: 'navigation',
  ROUTE: 'routes',
  DIRECTIONS: 'directions',
  
  // Security & Patrol
  SHIELD: 'shield',
  SHIELD_CHECK: 'shield-check',
  SHIELD_ALERT: 'shield-alert',
  SECURITY: 'security',
  PATROL: 'account-group',
  RANGER: 'account-hard-hat',
  CHECKPOINT: 'checkpoint',
  FENCE: 'gate',
  GATE: 'gate-arrow-right',
  
  // Vehicles & Transport
  CAR: 'car',
  TRUCK: 'truck',
  HELICOPTER: 'helicopter',
  DRONE: 'quadcopter',
  VEHICLE: 'car-side',
  
  // Communication & Reporting
  PHONE: 'phone',
  MESSAGE: 'message',
  EMAIL: 'email',
  RADIO: 'radio-tower',
  REPORT: 'file-document',
  DOCUMENT: 'file-document-outline',
  CLIPBOARD: 'clipboard-text',
  NOTES: 'note-text',
  
  // User & Account
  USER: 'account',
  USER_CIRCLE: 'account-circle',
  USERS: 'account-group',
  PROFILE: 'account-circle',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SETTINGS: 'cog',
  
  // Actions
  ADD: 'plus',
  REMOVE: 'minus',
  DELETE: 'delete',
  EDIT: 'pencil',
  SAVE: 'content-save',
  CANCEL: 'close',
  CONFIRM: 'check',
  REFRESH: 'refresh',
  SYNC: 'sync',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  SHARE: 'share-variant',
  SEARCH: 'magnify',
  FILTER: 'filter',
  SORT: 'sort',
  
  // Status
  ONLINE: 'wifi',
  OFFLINE: 'wifi-off',
  BATTERY: 'battery',
  BATTERY_LOW: 'battery-10',
  BATTERY_CHARGING: 'battery-charging',
  SIGNAL: 'signal',
  CLOCK: 'clock-outline',
  CALENDAR: 'calendar',
  
  // Dashboard & Overview
  HOME: 'home',
  DASHBOARD: 'view-dashboard',
  CHART: 'chart-line',
  STATISTICS: 'chart-bar',
  TRENDS: 'trending-up',
  
  // Weather & Environment
  SUN: 'weather-sunny',
  MOON: 'weather-night',
  RAIN: 'weather-rainy',
  CLOUD: 'weather-cloudy',
  TEMPERATURE: 'thermometer',
  WIND: 'weather-windy',
  
  // Misc
  STAR: 'star',
  HEART: 'heart',
  FLAG: 'flag',
  BOOKMARK: 'bookmark',
  NOTIFICATION: 'bell',
  HELP: 'help-circle',
  QUESTION: 'help-circle-outline',
  EXPAND: 'chevron-down',
  COLLAPSE: 'chevron-up',
  NEXT: 'chevron-right',
  PREVIOUS: 'chevron-left',
  CLOSE: 'close',
  MENU: 'menu',
  MORE: 'dots-vertical',
  LINK: 'link',
  CAMERA: 'camera',
  IMAGE: 'image',
  VIDEO: 'video',
  MICROPHONE: 'microphone',
  VOLUME: 'volume-high',
  EYE: 'eye',
  EYE_OFF: 'eye-off',
  LOCK: 'lock',
  UNLOCK: 'lock-open',
};

/**
 * Icon sets for different contexts
 */
export const ICON_SETS = {
  // Alert severity icons
  ALERT_SEVERITY: {
    critical: WILDLIFE_ICONS.ALERT_OCTAGON,
    high: WILDLIFE_ICONS.ALERT_CIRCLE,
    medium: WILDLIFE_ICONS.WARNING,
    low: WILDLIFE_ICONS.INFO,
  },
  
  // Status icons
  STATUS: {
    success: WILDLIFE_ICONS.SUCCESS,
    error: WILDLIFE_ICONS.ERROR,
    warning: WILDLIFE_ICONS.WARNING,
    info: WILDLIFE_ICONS.INFO,
  },
  
  // Tab navigation icons
  TAB_NAVIGATION: {
    dashboard: WILDLIFE_ICONS.DASHBOARD,
    alerts: WILDLIFE_ICONS.ALERT_CIRCLE,
    map: WILDLIFE_ICONS.MAP,
    reports: WILDLIFE_ICONS.REPORT,
    profile: WILDLIFE_ICONS.USER_CIRCLE,
  },
  
  // Wildlife species icons
  SPECIES: {
    elephant: WILDLIFE_ICONS.ELEPHANT,
    lion: WILDLIFE_ICONS.LION,
    rhino: WILDLIFE_ICONS.RHINO,
    giraffe: WILDLIFE_ICONS.GIRAFFE,
    zebra: WILDLIFE_ICONS.ZEBRA,
    buffalo: WILDLIFE_ICONS.BUFFALO,
    leopard: WILDLIFE_ICONS.LEOPARD,
    cheetah: WILDLIFE_ICONS.CHEETAH,
    generic: WILDLIFE_ICONS.GENERIC_ANIMAL,
  },
  
  // Map marker types
  MAP_MARKERS: {
    alert: WILDLIFE_ICONS.MAP_MARKER_ALERT,
    checkpoint: WILDLIFE_ICONS.SHIELD_CHECK,
    patrol: WILDLIFE_ICONS.PATROL,
    vehicle: WILDLIFE_ICONS.CAR,
    camera: WILDLIFE_ICONS.CAMERA_TRAP,
    user: WILDLIFE_ICONS.USER,
    animal: WILDLIFE_ICONS.GENERIC_ANIMAL,
  },
};

/**
 * Icon sizes for consistency
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

/**
 * Get icon name by context and type
 */
export const getIconName = (context, type) => {
  return ICON_SETS[context]?.[type] || WILDLIFE_ICONS.HELP;
};

/**
 * Common icon configurations
 */
export const ICON_CONFIGS = {
  // Alert markers
  alertMarker: {
    critical: {
      name: WILDLIFE_ICONS.ALERT_OCTAGON,
      library: 'MaterialCommunityIcons',
      size: ICON_SIZES.lg,
    },
    high: {
      name: WILDLIFE_ICONS.ALERT_CIRCLE,
      library: 'MaterialCommunityIcons',
      size: ICON_SIZES.lg,
    },
    medium: {
      name: WILDLIFE_ICONS.WARNING,
      library: 'MaterialCommunityIcons',
      size: ICON_SIZES.md,
    },
    low: {
      name: WILDLIFE_ICONS.INFO,
      library: 'MaterialCommunityIcons',
      size: ICON_SIZES.md,
    },
  },
  
  // Tab icons
  tabIcon: {
    size: ICON_SIZES.lg,
    library: 'MaterialCommunityIcons',
  },
  
  // Button icons
  buttonIcon: {
    size: ICON_SIZES.md,
    library: 'MaterialCommunityIcons',
  },
};

export default WILDLIFE_ICONS;

