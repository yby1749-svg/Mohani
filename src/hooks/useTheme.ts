import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { DarkColors, LightColors } from '../constants/theme';

export type ThemeColors = typeof DarkColors;

export const useTheme = () => {
  const { settings, updateSettings } = useSettings();

  const colors = useMemo((): ThemeColors => {
    return settings.darkMode ? DarkColors : LightColors;
  }, [settings.darkMode]);

  const isDark = settings.darkMode;

  const toggleTheme = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const setDarkMode = (value: boolean) => {
    updateSettings({ darkMode: value });
  };

  return {
    colors,
    isDark,
    toggleTheme,
    setDarkMode,
  };
};

export default useTheme;
