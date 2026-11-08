import React from 'react';
import Svg, { Path } from 'react-native-svg';

// O mesmo dente dos apps web (traço de 2, estilo "outline").
const TOOTH = 'M8 3c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7 .3 2 .8 5.5 2 5.5s1.4-3 2-4.5c.4-1 .9-1.2 2-1.2s1.6.2 2 1.2c.6 1.5.8 4.5 2 4.5s1.7-3.5 2-5.5c.5-3 2-4 2-7C20 5 18.5 3 16 3c-1.5 0-2.5.8-4 .8S9.5 3 8 3z';

export default function ToothIcon({ size = 24, color = '#000000', strokeWidth = 2 }) {
  return (
    <Svg accessibilityElementsHidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={TOOTH} />
    </Svg>
  );
}
