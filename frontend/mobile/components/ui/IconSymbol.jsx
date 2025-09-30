// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'bell': 'notifications',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'map.fill': 'map',
  'doc.text.fill': 'description',
  'person.fill': 'person',
  'mappin': 'place',
  'eye.fill': 'visibility',
  'xmark.circle.fill': 'cancel',
  'person.crop.circle': 'account-circle',
  'lock.shield': 'security',
  'gearshape': 'settings',
  'icloud.and.arrow.down': 'cloud-download',
  'questionmark.circle': 'help',
  'info.circle': 'info',
  'pencil': 'edit',
  'location': 'location-on',
  'moon': 'dark-mode',
  'arrow.triangle.2.circlepath': 'sync',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}