import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../models/settings.model';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';
import { AUTH_STORAGE } from './auth-storage';
import { SettingsService } from './settings.service';

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

describe('SettingsService', () => {
  let service: SettingsService;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};

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

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads default settings when none are stored', () => {
    expect(service.settings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('persists appearance updates to localStorage', () => {
    service.updateAppearance({ theme: 'dark', compactMode: true });

    expect(service.appearance()).toEqual({
      ...DEFAULT_APP_SETTINGS.appearance,
      theme: 'dark',
      compactMode: true,
    });
    expect(JSON.parse(storage[SETTINGS_STORAGE_KEY] ?? '{}').appearance.theme).toBe(
      'dark',
    );
  });

  it('persists notification, security, and preference updates', () => {
    service.updateNotifications({ emailNotifications: true });
    service.updateSecurity({ twoFactorEnabled: true, sessionTimeoutMinutes: 60 });
    service.updatePreferences({
      language: 'es',
      timezone: 'America/New_York',
    });

    expect(service.notifications().emailNotifications).toBe(true);
    expect(service.security().twoFactorEnabled).toBe(true);
    expect(service.security().sessionTimeoutMinutes).toBe(60);
    expect(service.preferences().language).toBe('es');
    expect(service.preferences().timezone).toBe('America/New_York');
  });

  it('exports and imports settings as JSON', () => {
    service.updateAppearance({ sidebarBehavior: 'collapsed' });

    const exported = service.exportSettings();
    service.resetSettings();
    expect(service.appearance().sidebarBehavior).toBe('expanded');

    const result = service.importSettings(exported);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.settings.appearance.sidebarBehavior).toBe('collapsed');
    }
    expect(service.appearance().sidebarBehavior).toBe('collapsed');
  });

  it('rejects invalid import JSON', () => {
    const result = service.importSettings('{ invalid json');

    expect(result).toEqual({
      success: false,
      error: 'Invalid settings JSON.',
    });
  });

  it('resets settings to defaults', () => {
    service.updateAppearance({ theme: 'dark' });
    service.resetSettings();

    expect(service.settings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('clears cached application data keys', () => {
    storage['app.auth.token'] = 'token';
    storage['app.theme'] = 'dark';
    storage[SETTINGS_STORAGE_KEY] = '{}';

    service.clearCachedData();

    expect(storage['app.auth.token']).toBeUndefined();
    expect(storage['app.theme']).toBeUndefined();
    expect(storage[SETTINGS_STORAGE_KEY]).toBeUndefined();
  });

  it('validates mock password changes', () => {
    expect(service.changePassword('', 'NewPassword1')).toEqual({
      success: false,
      error: 'Current password is required.',
    });
    expect(service.changePassword('Current123', '')).toEqual({
      success: false,
      error: 'New password is required.',
    });
    expect(service.changePassword('Current123', 'short')).toEqual({
      success: false,
      error: 'New password must be at least 8 characters.',
    });
    expect(service.changePassword('SamePassword', 'SamePassword')).toEqual({
      success: false,
      error: 'New password must differ from the current password.',
    });
    expect(service.changePassword('Current123', 'NewPassword1')).toEqual({
      success: true,
    });
  });

  it('merges stored partial settings with defaults on load', () => {
    storage[SETTINGS_STORAGE_KEY] = JSON.stringify({
      appearance: { theme: 'light' },
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const reloaded = TestBed.inject(SettingsService);

    expect(reloaded.appearance()).toEqual({
      ...DEFAULT_APP_SETTINGS.appearance,
      theme: 'light',
    });
    expect(reloaded.notifications()).toEqual(DEFAULT_APP_SETTINGS.notifications);
  });
});
