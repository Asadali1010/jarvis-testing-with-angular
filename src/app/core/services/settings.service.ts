import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  AppSettings,
  AppearanceSettings,
  DEFAULT_APP_SETTINGS,
  NotificationSettings,
  PreferenceSettings,
  SETTINGS_STORAGE_KEY,
  SecuritySettings,
  SettingsImportResult,
  SettingsSection,
} from '../models/settings.model';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';

// Re-export for convenience in components; security section only in model file below
export { DEFAULT_APP_SETTINGS, SETTINGS_STORAGE_KEY };

const APP_CACHE_KEYS = [
  SETTINGS_STORAGE_KEY,
  'app.auth.token',
  'app.theme',
  'app.users',
  'app.activities',
];

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly activityService = inject(ActivityService);

  private readonly settingsState = signal<AppSettings>(this.loadSettings());

  readonly settings = computed(() => this.settingsState());
  readonly appearance = computed(() => this.settingsState().appearance);
  readonly notifications = computed(() => this.settingsState().notifications);
  readonly security = computed(() => this.settingsState().security);
  readonly preferences = computed(() => this.settingsState().preferences);

  constructor() {
    effect(() => {
      this.persistSettings(this.settingsState());
    });
  }

  updateAppearance(partial: Partial<AppearanceSettings>): void {
    this.patchSection('appearance', partial);
  }

  updateNotifications(partial: Partial<NotificationSettings>): void {
    this.patchSection('notifications', partial);
  }

  updateSecurity(partial: Partial<SecuritySettings>): void {
    this.patchSection('security', partial);
  }

  updatePreferences(partial: Partial<PreferenceSettings>): void {
    this.patchSection('preferences', partial);
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
  ): { success: true } | { success: false; error: string } {
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();

    if (!trimmedCurrent) {
      return { success: false, error: 'Current password is required.' };
    }

    if (!trimmedNew) {
      return { success: false, error: 'New password is required.' };
    }

    if (trimmedNew.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters.',
      };
    }

    if (trimmedCurrent === trimmedNew) {
      return {
        success: false,
        error: 'New password must differ from the current password.',
      };
    }

    return { success: true };
  }

  exportSettings(): string {
    return JSON.stringify(this.settingsState(), null, 2);
  }

  importSettings(json: string): SettingsImportResult {
    try {
      const parsed = JSON.parse(json) as Partial<AppSettings>;
      const merged = this.mergeWithDefaults(parsed);
      this.settingsState.set(merged);
      this.recordSettingsActivity();
      return { success: true, settings: merged };
    } catch {
      return { success: false, error: 'Invalid settings JSON.' };
    }
  }

  resetSettings(): void {
    this.settingsState.set(structuredClone(DEFAULT_APP_SETTINGS));
    this.recordSettingsActivity();
  }

  clearCachedData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    for (const key of APP_CACHE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  private patchSection<T extends SettingsSection>(
    section: T,
    partial: Partial<AppSettings[T]>,
  ): void {
    this.settingsState.update((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...partial,
      },
    }));
    this.recordSettingsActivity();
  }

  private recordSettingsActivity(): void {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    const displayName = user.email.split('@')[0]?.replace(/\./g, ' ') ?? user.email;
    this.activityService.recordSettingsChange(displayName);
  }

  private loadSettings(): AppSettings {
    if (!isPlatformBrowser(this.platformId)) {
      return structuredClone(DEFAULT_APP_SETTINGS);
    }

    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return structuredClone(DEFAULT_APP_SETTINGS);
    }

    try {
      return this.mergeWithDefaults(JSON.parse(stored) as Partial<AppSettings>);
    } catch {
      return structuredClone(DEFAULT_APP_SETTINGS);
    }
  }

  private persistSettings(settings: AppSettings): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  private mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
    return {
      appearance: {
        ...DEFAULT_APP_SETTINGS.appearance,
        ...partial.appearance,
      },
      notifications: {
        ...DEFAULT_APP_SETTINGS.notifications,
        ...partial.notifications,
      },
      security: {
        ...DEFAULT_APP_SETTINGS.security,
        ...partial.security,
      },
      preferences: {
        ...DEFAULT_APP_SETTINGS.preferences,
        ...partial.preferences,
      },
    };
  }
}
