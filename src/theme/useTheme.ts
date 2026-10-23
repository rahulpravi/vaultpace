import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';
import { getThemeColors, ThemeColors } from './colors';

export function useAppTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: 'system' | 'light' | 'dark';
} {
  const systemScheme = useColorScheme();
  const themeMode = useStore((state) => state.settings.theme_mode);
  const accentColor = useStore((state) => state.settings.accent_color);

  const isDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemScheme === 'dark';

  const colors = getThemeColors(isDark, accentColor);

  return { colors, isDark, themeMode };
}
