import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'alexandria.theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1b1b1d' : '#f8f7f4');
  }, [theme]);

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return;
      setTheme(event.newValue === 'light' || event.newValue === 'dark'
        ? event.newValue
        : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  function chooseTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    try { localStorage.setItem(storageKey, nextTheme); } catch { /* Switching still works without storage. */ }
  }

  return { theme, chooseTheme };
}
