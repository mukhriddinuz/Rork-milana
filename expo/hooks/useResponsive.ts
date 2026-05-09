import { useWindowDimensions, Platform } from 'react-native';
import { useMemo } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  isWebMobile: boolean;
  isWebDesktop: boolean;
  numColumns: number;
}

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  return useMemo(() => {
    const isMobile = width < MOBILE_MAX;
    const isTablet = width >= MOBILE_MAX && width < TABLET_MAX;
    const isDesktop = width >= TABLET_MAX;

    const breakpoint: Breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;

    return {
      width,
      height,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isWeb,
      isWebMobile: isWeb && isMobile,
      isWebDesktop: isWeb && isDesktop,
      numColumns,
    };
  }, [width, height, isWeb]);
}
