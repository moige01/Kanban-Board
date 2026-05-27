import { create } from 'zustand';
import { getTheme, saveTheme } from '../api';
import { Theme } from '../types';

interface ThemeStore {
  theme: Theme;
  init: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',

  init: async () => {
    const theme = await getTheme();
    set({ theme });
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', () => applyTheme('system'));
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    applyTheme(theme);
    await saveTheme(theme);
  },
}));
