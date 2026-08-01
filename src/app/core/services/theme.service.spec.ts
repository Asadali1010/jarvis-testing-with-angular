import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY } from '../constants/auth.constants';
import { SETTINGS_STORAGE_KEY } from '../models/settings.model';
import { ActivityService } from './activity.service';
import { AUTH_STORAGE, AuthStorage, AuthUser } from './auth-storage';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

class InMemoryAuthStorage implements AuthStorage {
  private token: string | null = null;
  private user: AuthUser | null = null;

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  setToken(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
  }

  clear(): void {
    this.token = null;
    this.user = null;
  }
}

describe('ThemeService', () => {
  let themeService: ThemeService;
  let settingsService: SettingsService;
  let storage: Record<string, string>;
  let matchMediaListeners: Array<(event: MediaQueryListEvent) => void>;
  let prefersDark: boolean;

  beforeEach(() => {
    storage = {};
    matchMediaListeners = [];
    prefersDark = false;

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    });

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('dark') ? prefersDark : !prefersDark,
      media: query,
      addEventListener: (
        _event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        matchMediaListeners.push(listener);
      },
      removeEventListener: (
        _event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        matchMediaListeners = matchMediaListeners.filter((item) => item !== listener);
      },
    }));

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        SettingsService,
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useValue: new InMemoryAuthStorage() },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    themeService = TestBed.inject(ThemeService);
    settingsService = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
  });

  it('sets data-theme on the document for light mode', () => {
    settingsService.updateAppearance({ theme: 'light' });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(themeService.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('sets data-theme on the document for dark mode', () => {
    settingsService.updateAppearance({ theme: 'dark' });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(themeService.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('persists resolved theme to localStorage when toggling', () => {
    settingsService.updateAppearance({ theme: 'dark' });
    themeService.toggleTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(
      JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}').appearance.theme,
    ).toBe('light');
  });

  it('resolves system mode from prefers-color-scheme and updates on change', () => {
    prefersDark = true;
    settingsService.updateAppearance({ theme: 'system' });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(themeService.theme()).toBe('dark');

    prefersDark = false;
    for (const listener of matchMediaListeners) {
      listener({ matches: false } as MediaQueryListEvent);
    }

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(themeService.theme()).toBe('light');
  });

  it('defaults to light theme on the server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        SettingsService,
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useValue: new InMemoryAuthStorage() },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const serverThemeService = TestBed.inject(ThemeService);
    expect(serverThemeService.theme()).toBe('light');
  });
});
