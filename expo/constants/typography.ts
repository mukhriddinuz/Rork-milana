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
    color: '#000000',
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 38,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#000000',
  },
  price: {
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
    color: '#000000',
  },
};

export default FontFamily;
