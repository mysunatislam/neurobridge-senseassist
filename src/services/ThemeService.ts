export type ThemeMode = 'dark' | 'light';

export class ThemeService {
  private currentTheme: ThemeMode = 'dark';
  private listeners: Array<(theme: ThemeMode) => void> = [];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('neurobridge_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark') {
        this.currentTheme = saved;
      }
    }
    this.applyTheme(this.currentTheme);
  }

  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  public toggleTheme(): ThemeMode {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  public setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neurobridge_theme', theme);
    }
    this.applyTheme(theme);
    this.listeners.forEach(l => l(theme));
  }

  public addListener(listener: (theme: ThemeMode) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (theme: ThemeMode) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private applyTheme(theme: ThemeMode) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = '#080d1a';
        document.body.style.color = '#f1f5f9';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#0f172a';
      }
    }
  }
}

export const themeService = new ThemeService();
