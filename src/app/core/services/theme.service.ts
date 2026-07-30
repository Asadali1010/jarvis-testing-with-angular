import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { THEME_STORAGE_KEY } from '../constants/auth.constants';
import { SettingsThemeMode } from '../models/settings.model';
import { SettingsService } from './settings.service';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settingsService = inject(SettingsService);

  private readonly resolvedTheme = signal<ThemeMode>(this.resolveInitialTheme());
  private systemMediaQuery: MediaQueryList | null = null;
  private systemChangeHandler: ((event: MediaQueryListEvent) => void) | null = null;

  readonly theme = this.resolvedTheme.asReadonly();
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');
  readonly isLight = computed(() => this.resolvedTheme() === 'light');

  constructor() {
    effect(() => {
      const settingsTheme = this.settingsService.appearance().theme;
      this.applyThemeMode(settingsTheme);
    });

    effect(() => {
      this.applyToDocument(this.resolvedTheme());
    });
  }

  setTheme(theme: ThemeMode): void {
    this.settingsService.updateAppearance({ theme });
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private applyThemeMode(mode: SettingsThemeMode): void {
    this.cleanupSystemListener();

    if (mode === 'system') {
      if (isPlatformBrowser(this.platformId)) {
        this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.resolvedTheme.set(this.systemMediaQuery.matches ? 'dark' : 'light');
        this.systemChangeHandler = (event) => {
          this.resolvedTheme.set(event.matches ? 'dark' : 'light');
        };
        this.systemMediaQuery.addEventListener('change', this.systemChangeHandler);
      }
      return;
    }

    this.resolvedTheme.set(mode);
  }

  private resolveInitialTheme(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    const settingsTheme = this.settingsService.appearance().theme;
    if (settingsTheme === 'dark') {
      return 'dark';
    }
    if (settingsTheme === 'light') {
      return 'light';
    }
    if (settingsTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  }

  private applyToDocument(theme: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  private cleanupSystemListener(): void {
    if (
      this.systemMediaQuery &&
      this.systemChangeHandler &&
      isPlatformBrowser(this.platformId)
    ) {
      this.systemMediaQuery.removeEventListener('change', this.systemChangeHandler);
    }

    this.systemMediaQuery = null;
    this.systemChangeHandler = null;
  }
}
