import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';
import { cosmicBackgrounds } from './theme-config';

// ----------------------------------------------------------------------
// COSMIC FLOW Theme Overrides
// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#E0E7FF',
          light: '#A5B4FC',
          main: '#6366F1',
          dark: '#4F46E5',
          darker: '#3730A3',
          contrastText: '#FFFFFF',
        }),
        secondary: createPaletteChannel({
          lighter: '#FCE7F3',
          light: '#F9A8D4',
          main: '#EC4899',
          dark: '#DB2777',
          darker: '#9D174D',
          contrastText: '#FFFFFF',
        }),
        background: {
          default: cosmicBackgrounds.light.default,
          paper: cosmicBackgrounds.light.paper,
          neutral: cosmicBackgrounds.light.neutral,
        },
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#E0E7FF',
          light: '#A5B4FC',
          main: '#818CF8', // Lighter for dark mode
          dark: '#6366F1',
          darker: '#4F46E5',
          contrastText: '#FFFFFF',
        }),
        secondary: createPaletteChannel({
          lighter: '#FCE7F3',
          light: '#F9A8D4',
          main: '#F472B6', // Lighter for dark mode
          dark: '#EC4899',
          darker: '#DB2777',
          contrastText: '#FFFFFF',
        }),
        background: {
          default: cosmicBackgrounds.dark.default,
          paper: cosmicBackgrounds.dark.paper,
          neutral: cosmicBackgrounds.dark.neutral,
        },
      },
    },
  },
};
