import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AppLanguage,
  DateFormat,
  SettingsThemeMode,
  SidebarBehavior,
  TimeFormat,
} from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly appearance = this.settingsService.appearance;
  readonly notifications = this.settingsService.notifications;
  readonly security = this.settingsService.security;
  readonly preferences = this.settingsService.preferences;

  readonly passwordCurrent = signal('');
  readonly passwordNew = signal('');
  readonly passwordConfirm = signal('');
  readonly passwordMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly importJson = signal('');
  readonly appMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly themeOptions: { value: SettingsThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  readonly sidebarOptions: { value: SidebarBehavior; label: string }[] = [
    { value: 'expanded', label: 'Always expanded' },
    { value: 'collapsed', label: 'Always collapsed' },
    { value: 'hover', label: 'Expand on hover' },
  ];

  readonly languageOptions: { value: AppLanguage; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  readonly dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  readonly timeFormatOptions: { value: TimeFormat; label: string }[] = [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' },
  ];

  readonly timezoneOptions = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  readonly sessionTimeoutOptions = [15, 30, 60, 120];

  onThemeChange(theme: SettingsThemeMode): void {
    this.settingsService.updateAppearance({ theme });
  }

  onAppearanceChange(
    key: 'sidebarBehavior' | 'compactMode' | 'animationsEnabled',
    value: SidebarBehavior | boolean,
  ): void {
    this.settingsService.updateAppearance({ [key]: value });
  }

  onNotificationChange(
    key: 'browserNotifications' | 'emailNotifications' | 'soundNotifications',
    value: boolean,
  ): void {
    this.settingsService.updateNotifications({ [key]: value });
  }

  onSecurityChange(
    key: 'rememberMe' | 'twoFactorEnabled' | 'sessionTimeoutMinutes',
    value: boolean | number,
  ): void {
    this.settingsService.updateSecurity({ [key]: value });
  }

  onPreferenceChange(
    key: 'language' | 'dateFormat' | 'timeFormat' | 'timezone',
    value: string,
  ): void {
    this.settingsService.updatePreferences({ [key]: value } as never);
  }

  onChangePassword(): void {
    this.passwordMessage.set(null);

    const current = this.passwordCurrent().trim();
    const newPass = this.passwordNew().trim();
    const confirm = this.passwordConfirm().trim();

    if (newPass !== confirm) {
      this.passwordMessage.set({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    const result = this.settingsService.changePassword(current, newPass);

    if (result.success) {
      this.passwordMessage.set({
        type: 'success',
        text: 'Password updated successfully.',
      });
      this.passwordCurrent.set('');
      this.passwordNew.set('');
      this.passwordConfirm.set('');
      return;
    }

    this.passwordMessage.set({ type: 'error', text: result.error });
  }

  exportSettings(): void {
    const json = this.settingsService.exportSettings();
    if (isPlatformBrowser(this.platformId)) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'app-settings.json';
      anchor.click();
      URL.revokeObjectURL(url);
    }
    this.appMessage.set({ type: 'success', text: 'Settings exported successfully.' });
  }

  importSettings(): void {
    this.appMessage.set(null);
    const result = this.settingsService.importSettings(this.importJson());

    if (result.success) {
      this.appMessage.set({ type: 'success', text: 'Settings imported successfully.' });
      this.importJson.set('');
      return;
    }

    this.appMessage.set({ type: 'error', text: result.error });
  }

  resetSettings(): void {
    this.settingsService.resetSettings();
    this.appMessage.set({ type: 'success', text: 'Settings reset to defaults.' });
  }

  clearCachedData(): void {
    this.settingsService.clearCachedData();
    this.appMessage.set({
      type: 'success',
      text: 'Cached application data cleared. You may need to sign in again.',
    });
  }
}
