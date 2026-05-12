export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export const getStoredTheme = (): Theme => {
  try {
    const t = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (t === 'light' || t === 'dark') return t;
  } catch {}
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

export const applyTheme = (theme: Theme) => {
  try {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
};

export const toggleTheme = (): Theme => {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
