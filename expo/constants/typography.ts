import { Platform, TextStyle } from 'react-native';

export const FUTURA_STACK = 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif';

export const FontFamily = {
  regular: Platform.select({
    ios: 'Futura',
    android: 'sans-serif',
    default: FUTURA_STACK,
  }) as string,
  medium: Platform.select({
    ios: 'Futura-Medium',
    android: 'sans-serif-medium',
    default: FUTURA_STACK,
  }) as string,
  bold: Platform.select({
    ios: 'Futura-Bold',
    android: 'sans-serif-medium',
    default: FUTURA_STACK,
  }) as string,
};

export const futuraFont = (weight: 'regular' | 'medium' | 'bold' = 'regular'): Pick<TextStyle, 'fontFamily'> => ({
  fontFamily: FontFamily[weight],
});

export const Typography = {
  logo: {
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
  },
  navLink: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 38,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    textAlign: 'center' as const,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    fontWeight: '400' as const,
  },
  price: {
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export default FontFamily;
