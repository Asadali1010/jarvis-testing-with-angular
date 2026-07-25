import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  
  // Use a signal for reactive theme tracking
  public theme = signal<Theme>('light');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    try {
      // Check if localStorage is available (browser environment)
      if (typeof localStorage !== 'undefined') {
        const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          this.theme.set(savedTheme);
        } else {
          this.setSystemTheme();
        }
      } else {
        // Server-side rendering or non-browser environment
        this.setSystemTheme();
      }
    } catch (error) {
      console.error('Error accessing localStorage for theme preference:', error);
      this.setSystemTheme();
    }
    
    this.applyThemeToDocument();
  }

  private setSystemTheme(): void {
    // Fallback to system preference if available
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }
  }

  public toggleTheme(): void {
    const newTheme: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.applyThemeToDocument();
    this.saveTheme(theme);
  }

  private applyThemeToDocument(): void {
    // We apply a class or data-attribute to the root element. 
    // Using a class 'dark' on <html> is a common pattern for Tailwind CSS.
    try {
      if (typeof document !== 'undefined') {
        if (this.theme() === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Could not apply theme to document:', error);
    }
  }

  private saveTheme(theme: Theme): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.THEME_KEY, theme);
      }
    } catch (error) {
      console.error('Could not save theme to localStorage:', error);
    }
  }
}
