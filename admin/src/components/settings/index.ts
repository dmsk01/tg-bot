// Settings stub for admin panel
// Admin doesn't need complex settings like frontend

import type { ThemeColorPreset } from '../../theme/with-settings/color-presets';

export type SettingsState = {
  colorScheme: 'light' | 'dark';
  direction: 'ltr' | 'rtl';
  contrast: 'default' | 'high';
  navLayout: 'vertical' | 'horizontal' | 'mini';
  primaryColor: ThemeColorPreset;
  navColor: 'integrate' | 'apparent';
  compactLayout: boolean;
  fontSize: number;
  fontFamily?: string;
};

export const defaultSettings: SettingsState = {
  colorScheme: 'dark',
  direction: 'ltr',
  contrast: 'default',
  navLayout: 'vertical',
  primaryColor: 'default',
  navColor: 'integrate',
  compactLayout: true,
  fontSize: 16,
};

// Stub for useSettingsContext - admin uses fixed settings
export function useSettingsContext() {
  return {
    state: defaultSettings,
    setState: () => {},
    canReset: false,
    onReset: () => {},
  };
}
