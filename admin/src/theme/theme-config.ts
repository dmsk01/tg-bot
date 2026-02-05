import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------
// COSMIC FLOW — Telegram Premium inspired palette
// Gradient: indigo → violet → pink with cosmic depth
// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'dark',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'Public Sans Variable',
    secondary: 'Barlow',
  },
  /** **************************************
   * Palette — Cosmic Flow
   *************************************** */
  palette: {
    // Primary: Indigo (gradient start)
    primary: {
      lighter: '#E0E7FF',
      light: '#A5B4FC',
      main: '#6366F1',
      dark: '#4F46E5',
      darker: '#3730A3',
      contrastText: '#FFFFFF',
    },
    // Secondary: Hot Pink (gradient end)
    secondary: {
      lighter: '#FCE7F3',
      light: '#F9A8D4',
      main: '#EC4899',
      dark: '#DB2777',
      darker: '#9D174D',
      contrastText: '#FFFFFF',
    },
    // Info: Cyan
    info: {
      lighter: '#CFFAFE',
      light: '#67E8F9',
      main: '#06B6D4',
      dark: '#0891B2',
      darker: '#155E75',
      contrastText: '#FFFFFF',
    },
    // Success: Emerald
    success: {
      lighter: '#D1FAE5',
      light: '#6EE7B7',
      main: '#10B981',
      dark: '#047857',
      darker: '#064E3B',
      contrastText: '#FFFFFF',
    },
    // Warning: Amber
    warning: {
      lighter: '#FEF3C7',
      light: '#FCD34D',
      main: '#F59E0B',
      dark: '#D97706',
      darker: '#92400E',
      contrastText: '#000000',
    },
    // Error: Rose
    error: {
      lighter: '#FFE4E6',
      light: '#FCA5A5',
      main: '#EF4444',
      dark: '#DC2626',
      darker: '#991B1B',
      contrastText: '#FFFFFF',
    },
    // Grey: Zinc (neutral, works with vibrant colors)
    grey: {
      '50': '#FAFAFA',
      '100': '#F4F4F5',
      '200': '#E4E4E7',
      '300': '#D4D4D8',
      '400': '#A1A1AA',
      '500': '#71717A',
      '600': '#52525B',
      '700': '#3F3F46',
      '800': '#27272A',
      '900': '#18181B',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};

// ----------------------------------------------------------------------
// Cosmic Flow Gradients
// ----------------------------------------------------------------------
export const cosmicGradients = {
  primary: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
  primaryHover: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 50%, #DB2777 100%)',
  primarySubtle: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 50%, rgba(236,72,153,0.15) 100%)',
  primaryDark: 'linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #F472B6 100%)',
};

export const cosmicBackgrounds = {
  dark: {
    default: '#0C0A1D',
    paper: '#13102B',
    neutral: '#1A1635',
  },
  light: {
    default: '#FAFAFF',
    paper: '#FFFFFF',
    neutral: '#F4F4F9',
  },
};
