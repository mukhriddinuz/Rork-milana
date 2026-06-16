// Milana Premium palette.
// A single source of truth for colours used across screens. Previously
// this file only held the Expo starter `light` map, so every `Colors.*`
// reference resolved to `undefined` at runtime — leaving many staff/auth
// screens unstyled. The full luxury palette below matches the hand-tuned
// hex values used elsewhere in the app.

const tintColorLight = '#1A1A1A';

const Colors = {
  // Brand
  primary: '#1A1A1A',
  primaryDark: '#000000',
  primaryLight: '#4A4A4A',

  // Surfaces
  background: '#FAFAFA',
  white: '#FFFFFF',
  cardShadow: 'rgba(0,0,0,0.08)',

  // Text
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // Lines
  border: '#DDDDDD',
  borderLight: '#EAEAEA',

  // Feedback
  danger: '#B53030',
  dangerLight: '#FCEAEA',
  newOrderHighlight: '#FFF5E6',

  // Order statuses
  statusPending: '#B86E00',
  statusPendingLight: '#FFF5E6',
  statusProcessing: '#1F4FC1',
  statusProcessingLight: '#E6F0FF',
  statusCompleted: '#1B5E20',
  statusCompletedLight: '#E8F5E9',
  statusCancelled: '#B53030',
  statusCancelledLight: '#FCEAEA',

  // Product statuses
  statusDraft: '#999999',
  statusDraftText: '#666666',
  statusPublished: '#1B5E20',
  statusPublishedText: '#1B5E20',

  // Backwards-compatible Expo Router theming map.
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorLight,
  },
};

export default Colors;
