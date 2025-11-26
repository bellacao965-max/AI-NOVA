// Color Themes System - MODERN VIBRANT DESIGN
export type ThemeName = 'cyberpunk' | 'ocean' | 'matrix' | 'sunset' | 'neon';

export interface Theme {
  name: ThemeName;
  primary: string;
  secondary: string;
  accent: string;
  display: string;
  glow: string;
  button: string;
  border: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'cyberpunk',
    primary: 'from-violet-600 via-purple-600 to-indigo-600',
    secondary: 'violet-400',
    accent: 'violet-500',
    glow: 'shadow-[0_0_30px_rgba(167,139,250,0.6)]',
    button: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
    border: 'border-violet-500/30',
    display: '✨ Cyberpunk Pro'
  },
  ocean: {
    name: 'ocean',
    primary: 'from-cyan-500 via-blue-500 to-blue-600',
    secondary: 'cyan-300',
    accent: 'cyan-400',
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.6)]',
    button: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
    border: 'border-cyan-400/30',
    display: '🌊 Ocean Wave'
  },
  matrix: {
    name: 'matrix',
    primary: 'from-lime-500 via-green-500 to-emerald-600',
    secondary: 'lime-300',
    accent: 'lime-400',
    glow: 'shadow-[0_0_30px_rgba(132,204,22,0.6)]',
    button: 'from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500',
    border: 'border-lime-400/30',
    display: '💚 Matrix Reborn'
  },
  sunset: {
    name: 'sunset',
    primary: 'from-orange-500 via-pink-500 to-rose-600',
    secondary: 'orange-300',
    accent: 'orange-400',
    glow: 'shadow-[0_0_30px_rgba(251,146,60,0.6)]',
    button: 'from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500',
    border: 'border-orange-400/30',
    display: '🌅 Sunset Glow'
  },
  neon: {
    name: 'neon',
    primary: 'from-pink-600 via-purple-600 to-fuchsia-600',
    secondary: 'pink-300',
    accent: 'pink-400',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.6)]',
    button: 'from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500',
    border: 'border-pink-400/30',
    display: '⚡ Neon Flash'
  }
};

export function getCurrentTheme(): ThemeName {
  const saved = localStorage.getItem('novaTheme');
  return (saved as ThemeName) || 'cyberpunk';
}

export function setTheme(theme: ThemeName): void {
  localStorage.setItem('novaTheme', theme);
}

export function getThemeColors(): Theme {
  const themeName = getCurrentTheme();
  return THEMES[themeName];
}

export function applyTheme(themeName: ThemeName): void {
  const theme = THEMES[themeName];
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-glow', theme.glow);
  root.style.setProperty('--theme-button', theme.button);
  root.style.setProperty('--theme-border', theme.border);
}
