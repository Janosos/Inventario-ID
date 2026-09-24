import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<Theme>('dark');

  constructor() {
    const saved = localStorage.getItem('inventario-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      this.currentTheme.set(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'dark'); // Default to sleek dark mode
    }

    this.applyTheme(this.currentTheme());

    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem('inventario-theme', theme);
    });
  }

  toggleTheme(): void {
    this.currentTheme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}
