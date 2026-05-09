import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ToteIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

/**
 * Elegant tote-style shopping bag icon for luxury product cards.
 * Features thin curved handles and a clean rectangular body,
 * mimicking a classic high-end retail tote.
 */
export default function ToteIcon({
  size = 22,
  color = '#000000',
  strokeWidth = 1.2,
  fill = 'none',
}: ToteIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.2 8h15.6l-1.1 12.2a1.4 1.4 0 0 1-1.4 1.3H6.7a1.4 1.4 0 0 1-1.4-1.3L4.2 8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={fill}
      />
      <Path
        d="M8.5 8V6.2a3.5 3.5 0 0 1 7 0V8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
