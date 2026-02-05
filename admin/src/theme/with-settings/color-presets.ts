import type { PaletteColorNoChannels } from '../core';

import { primary, secondary } from '../core/palette';

// ----------------------------------------------------------------------
// COSMIC FLOW Color Presets
// ----------------------------------------------------------------------

export type ThemeColorPreset =
  | 'default'
  | 'cosmic'
  | 'preset1'
  | 'preset2'
  | 'preset3'
  | 'preset4';

export const primaryColorPresets: Record<ThemeColorPreset, PaletteColorNoChannels> = {
  // Cosmic Flow - Indigo (default)
  default: {
    lighter: primary.lighter,
    light: primary.light,
    main: primary.main,
    dark: primary.dark,
    darker: primary.darker,
    contrastText: primary.contrastText,
  },
  // Cosmic Violet variant
  cosmic: {
    lighter: '#EDE9FE',
    light: '#C4B5FD',
    main: '#A855F7',
    dark: '#7C3AED',
    darker: '#5B21B6',
    contrastText: '#FFFFFF',
  },
  // Cyan
  preset1: {
    lighter: '#CFFAFE',
    light: '#67E8F9',
    main: '#06B6D4',
    dark: '#0891B2',
    darker: '#155E75',
    contrastText: '#FFFFFF',
  },
  // Purple
  preset2: {
    lighter: '#EBD6FD',
    light: '#B985F4',
    main: '#7635DC',
    dark: '#431A9E',
    darker: '#200A69',
    contrastText: '#FFFFFF',
  },
  // Blue
  preset3: {
    lighter: '#DBEAFE',
    light: '#93C5FD',
    main: '#3B82F6',
    dark: '#2563EB',
    darker: '#1E40AF',
    contrastText: '#FFFFFF',
  },
  // Rose
  preset4: {
    lighter: '#FFE4E6',
    light: '#FECDD3',
    main: '#F43F5E',
    dark: '#E11D48',
    darker: '#9F1239',
    contrastText: '#FFFFFF',
  },
};

export const secondaryColorPresets: Record<ThemeColorPreset, PaletteColorNoChannels> = {
  // Cosmic Flow - Hot Pink (default)
  default: {
    lighter: secondary.lighter,
    light: secondary.light,
    main: secondary.main,
    dark: secondary.dark,
    darker: secondary.darker,
    contrastText: secondary.contrastText,
  },
  // Cosmic Indigo variant
  cosmic: {
    lighter: '#E0E7FF',
    light: '#A5B4FC',
    main: '#6366F1',
    dark: '#4F46E5',
    darker: '#3730A3',
    contrastText: '#FFFFFF',
  },
  // Orange
  preset1: {
    lighter: '#FFEDD5',
    light: '#FDBA74',
    main: '#F97316',
    dark: '#EA580C',
    darker: '#9A3412',
    contrastText: '#FFFFFF',
  },
  // Teal
  preset2: {
    lighter: '#CCFBF1',
    light: '#5EEAD4',
    main: '#14B8A6',
    dark: '#0D9488',
    darker: '#115E59',
    contrastText: '#FFFFFF',
  },
  // Amber
  preset3: {
    lighter: '#FEF3C7',
    light: '#FCD34D',
    main: '#F59E0B',
    dark: '#D97706',
    darker: '#92400E',
    contrastText: '#000000',
  },
  // Sky
  preset4: {
    lighter: '#E0F2FE',
    light: '#7DD3FC',
    main: '#0EA5E9',
    dark: '#0284C7',
    darker: '#075985',
    contrastText: '#FFFFFF',
  },
};
