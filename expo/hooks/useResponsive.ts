import { useWindowDimensions, Platform } from 'react-native';
import { useMemo } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';

/**
 * Single source of truth for layout breakpoints (in px of window width).
 * Every screen/component must derive its responsive behaviour from these
 * values — never hardcode raw width comparisons elsewhere.
 *
 *   width < 768            → mobile  (phones)
 *   768 ≤ width < 1024     → tablet
 *   1024 ≤ width < 1440    → desktop
 *   width ≥ 1440           → largeDesktop
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  largeDesktop: 1440,
} as const;

/** Max width for centered desktop content blocks. */
export const CONTENT_MAX_WIDTH = 1440;

interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  /** width < 768 */
  isMobile: boolean;
  /** 768 ≤ width < 1024 */
  isTablet: boolean;
  /** width ≥ 1024 */
  isDesktop: boolean;
  /** width ≥ 1440 */
  isLargeDesktop: boolean;
  /** width ≥ 768 — tablet or larger (any non-phone layout) */
  isWideScreen: boolean;
  isWeb: boolean;
  /** web AND phone width */
  isWebMobile: boolean;
  /** web AND width ≥ 1024 */
  isWebDesktop: boolean;
  /** Recommended product-grid column count for the current width. */
  numColumns: number;
  /** Max content width, capped for large desktops. */
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  return useMemo(() => {
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;
    const isLargeDesktop = width >= BREAKPOINTS.largeDesktop;
    const isWideScreen = width >= BREAKPOINTS.mobile;

    const breakpoint: Breakpoint = isLargeDesktop
      ? 'largeDesktop'
      : isDesktop
        ? 'desktop'
        : isTablet
          ? 'tablet'
          : 'mobile';

    const numColumns = isLargeDesktop ? 4 : isDesktop ? 4 : isTablet ? 3 : 2;

    return {
      width,
      height,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      isWideScreen,
      isWeb,
      isWebMobile: isWeb && isMobile,
      isWebDesktop: isWeb && isDesktop,
      numColumns,
      contentMaxWidth: CONTENT_MAX_WIDTH,
    };
  }, [width, height, isWeb]);
}
