import { AccentColor } from '../types';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  border: string;
  borderInput: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentLight: string;
  onAccent: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  tabBar: string;
  tabBarBorder: string;
}

export const ACCENT_PALETTES: Record<
  AccentColor,
  { primary: string; lightDark: string; lightMode: string; label: string }
> = {
  emerald: { primary: '#10b981', lightDark: 'rgba(16, 185, 129, 0.15)', lightMode: '#d1fae5', label: 'Emerald' },
  teal: { primary: '#14b8a6', lightDark: 'rgba(20, 184, 166, 0.15)', lightMode: '#ccfbf1', label: 'Teal' },
  cyan: { primary: '#06b6d4', lightDark: 'rgba(6, 182, 212, 0.15)', lightMode: '#cffafe', label: 'Cyan' },
  blue: { primary: '#3b82f6', lightDark: 'rgba(59, 130, 246, 0.15)', lightMode: '#dbeafe', label: 'Blue' },
  indigo: { primary: '#6366f1', lightDark: 'rgba(99, 102, 241, 0.15)', lightMode: '#e0e7ff', label: 'Indigo' },
  violet: { primary: '#8b5cf6', lightDark: 'rgba(139, 92, 246, 0.15)', lightMode: '#ede9fe', label: 'Violet' },
  fuchsia: { primary: '#d946ef', lightDark: 'rgba(217, 70, 239, 0.15)', lightMode: '#fae8ff', label: 'Fuchsia' },
  rose: { primary: '#f43f5e', lightDark: 'rgba(244, 63, 94, 0.15)', lightMode: '#ffe4e6', label: 'Rose' },
  amber: { primary: '#f59e0b', lightDark: 'rgba(245, 158, 11, 0.15)', lightMode: '#fef3c7', label: 'Amber' },
  yellow: { primary: '#eab308', lightDark: 'rgba(234, 179, 8, 0.15)', lightMode: '#fef9c3', label: 'Yellow' },
};

export const LIGHT_THEME_BASE = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderInput: '#CBD5E1',
  text: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  onAccent: '#FFFFFF',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const DARK_THEME_BASE = {
  background: '#0B0F17',
  surface: '#111827',
  surfaceSubtle: '#1F2937',
  card: '#161F30',
  border: '#283548',
  borderInput: '#374151',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textSubtle: '#6B7280',
  onAccent: '#FFFFFF',
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.15)',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  tabBar: '#111827',
  tabBarBorder: '#1F2937',
};

export function getThemeColors(isDark: boolean, accentKey: AccentColor = 'emerald'): ThemeColors {
  const base = isDark ? DARK_THEME_BASE : LIGHT_THEME_BASE;
  const accentDef = ACCENT_PALETTES[accentKey] || ACCENT_PALETTES.emerald;
  const accentLight = isDark ? accentDef.lightDark : accentDef.lightMode;

  return {
    ...base,
    accent: accentDef.primary,
    accentLight,
  };
}
