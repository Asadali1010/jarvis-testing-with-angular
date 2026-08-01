import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY } from '../constants/auth.constants';
import { SETTINGS_STORAGE_KEY } from '../models/settings.model';
import { ActivityService } from './activity.service';
import { AUTH_STORAGE } from './auth-storage';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

class InMemoryAuthStorage {
  getToken(): null {
    return null;
  }

  getUser(): null {
    return null;
  }

  setToken(): void {}

  clear(): void {}
}

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('ThemeService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    document.documentElement.removeAttribute('data-theme');

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
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
  });

  function configureThemeService(platformId: 'browser' | 'server'): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        AuthService,
        ActivityService,
        ThemeService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });

    return TestBed.inject(ThemeService);
  }

  it('applies light theme in the browser', () => {
    const themeService = configureThemeService('browser');

    themeService.setTheme('light');

    expect(themeService.theme()).toBe('light');
    expect(themeService.isLight()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('applies dark theme in the browser', () => {
    const themeService = configureThemeService('browser');

    themeService.setTheme('dark');

    expect(themeService.theme()).toBe('dark');
    expect(themeService.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('resolves system theme from prefers-color-scheme in the browser', () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true));
    storage[SETTINGS_STORAGE_KEY] = JSON.stringify({
      appearance: { theme: 'system' },
    });

    const themeService = configureThemeService('browser');

    expect(themeService.theme()).toBe('dark');
  });

  it('defaults to light theme on the server without touching the document', () => {
    storage[SETTINGS_STORAGE_KEY] = JSON.stringify({
      appearance: { theme: 'dark' },
    });

    const themeService = configureThemeService('server');

    expect(themeService.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('does not register system listeners on the server', () => {
    const matchMedia = createMatchMedia(false);
    vi.stubGlobal('matchMedia', matchMedia);
    storage[SETTINGS_STORAGE_KEY] = JSON.stringify({
      appearance: { theme: 'system' },
    });

    configureThemeService('server');

    expect(matchMedia).not.toHaveBeenCalled();
  });
});
