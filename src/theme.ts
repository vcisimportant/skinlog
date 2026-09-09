import { useColorScheme } from 'react-native';

export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  moss: string;
  mossSoft: string;
  flare: string;
  flareSoft: string;
  amber: string;
  onAccent: string; // text sitting on a moss or flare fill
  scale: string[]; // 1 = calm, 5 = bad
};

const light: Palette = {
  bg: '#EDF1EA',
  surface: '#FFFFFF',
  ink: '#1E3127',
  inkSoft: '#5C6E63',
  line: '#D3DBD4',
  moss: '#4F7A63',
  mossSoft: '#DCE8DF',
  flare: '#BF5F5B',
  flareSoft: '#F3DEDC',
  amber: '#C89A4B',
  onAccent: '#FFFFFF',
  scale: ['#4F7A63', '#7F9A6C', '#B39C5C', '#C77C5C', '#BF5F5B'],
};

// The same hues lifted and desaturated so they still read as one ramp against a
// dark ground, where the light palette's greens go muddy.
const dark: Palette = {
  bg: '#141A16',
  surface: '#1E2822',
  ink: '#E6EDE7',
  inkSoft: '#93A597',
  line: '#2E3B33',
  moss: '#7FB295',
  mossSoft: '#26362D',
  flare: '#E08A85',
  flareSoft: '#3A2624',
  amber: '#D9AE63',
  onAccent: '#101613',
  scale: ['#6FA588', '#96B27C', '#C7B06B', '#D9906E', '#E08A85'],
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { pill: 999, card: 14, control: 10 };
