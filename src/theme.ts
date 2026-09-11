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
  amberSoft: string;
  onAccent: string; // text sitting on a moss or flare fill
  scale: string[]; // 1 = calm, 5 = bad
};

const light: Palette = {
  bg: '#F4F0E6',
  surface: '#FFFCF5',
  ink: '#241F1A',
  inkSoft: '#7C7268',
  line: '#DED5C4',
  moss: '#4F7A63',
  mossSoft: '#E2EADF',
  flare: '#9C4A2F',
  flareSoft: '#EFE1D8',
  amber: '#B07D2E',
  amberSoft: '#F2E6CE',
  onAccent: '#FFFCF5',
  scale: ['#5C7356', '#8A8B4F', '#B8894A', '#B06A3E', '#9C4A2F'],
};

const dark: Palette = {
  bg: '#1A1714',
  surface: '#242019',
  ink: '#F0E9DD',
  inkSoft: '#9C9183',
  line: '#3A332A',
  moss: '#84B79A',
  mossSoft: '#23302A',
  flare: '#D4795A',
  flareSoft: '#332720',
  amber: '#C79A4E',
  amberSoft: '#352C1C',
  onAccent: '#1A1714',
  scale: ['#7E9670', '#A3A063', '#C7A25C', '#CE8459', '#D4795A'],
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { pill: 999, card: 10, control: 8 };
