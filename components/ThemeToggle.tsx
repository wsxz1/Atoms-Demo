'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

/**
 * Lightweight theme toggle without an external dependency.
 * Pairs with the inline `<script>` in app/layout.tsx that applies the
 * persisted theme before first paint, avoiding the flash-of-wrong-theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem('atoms_theme') as Theme | null) ?? null;
    const initial: Theme =
      stored ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');
    setTheme(initial);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    localStorage.setItem('atoms_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (!theme) {
    return <div className="h-7 w-7" aria-hidden />;
  }

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      onClick={() => apply(next)}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:text-foreground"
      title={`切换到${next === 'dark' ? '暗色' : '亮色'}模式`}
      aria-label="切换主题"
    >
      {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  );
}
