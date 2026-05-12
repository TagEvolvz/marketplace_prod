import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getStoredTheme, toggleTheme, applyTheme } from '../../utils/theme';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const handle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button onClick={handle} aria-label="Toggle theme" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">
      {theme === 'dark' || document.documentElement.classList.contains('dark') ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
