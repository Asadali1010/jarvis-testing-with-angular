import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../../core/models/settings.model';
import { ActivityService } from '../../core/services/activity.service';
import { AUTH_STORAGE } from '../../core/services/auth-storage';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { SettingsComponent } from './settings.component';

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

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;
  let storage: Record<string, string>;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        SettingsService,
        AuthService,
        ActivityService,
        ThemeService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function sectionTitle(id: string): string | undefined {
    return fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim();
  }

  it('renders all settings sections', () => {
    expect(sectionTitle('appearance-heading')).toBe('Appearance');
    expect(sectionTitle('notifications-heading')).toBe('Notifications');
    expect(sectionTitle('security-heading')).toBe('Security');
    expect(sectionTitle('preferences-heading')).toBe('Preferences');
    expect(sectionTitle('app-settings-heading')).toBe('Application settings');
  });

  it('renders appearance controls', () => {
    expect(fixture.nativeElement.querySelector('#setting-theme')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-compact')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-animations')).toBeTruthy();
  });

  it('persists appearance changes via SettingsService', () => {
    fixture.componentInstance.onThemeChange('dark');
    fixture.detectChanges();

    expect(settingsService.appearance().theme).toBe('dark');
    expect(JSON.parse(storage[SETTINGS_STORAGE_KEY] ?? '{}').appearance.theme).toBe('dark');
  });

  it('persists notification toggles', () => {
    fixture.componentInstance.onNotificationChange('emailNotifications', true);
    fixture.detectChanges();

    expect(settingsService.notifications().emailNotifications).toBe(true);
  });

  it('renders security controls including password change', () => {
    expect(fixture.nativeElement.querySelector('#password-current')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password-new')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password-confirm')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-remember-me')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-session-timeout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#setting-2fa')).toBeTruthy();
  });

  it('validates mock password change', () => {
    fixture.componentInstance.passwordCurrent.set(AUTH_CREDENTIALS.password);
    fixture.componentInstance.passwordNew.set('short');
    fixture.componentInstance.passwordConfirm.set('short');
    fixture.componentInstance.onChangePassword();
    fixture.detectChanges();

    expect(fixture.componentInstance.passwordMessage()?.type).toBe('error');

    fixture.componentInstance.passwordNew.set('NewPassword1');
    fixture.componentInstance.passwordConfirm.set('NewPassword1');
    fixture.componentInstance.onChangePassword();
    fixture.detectChanges();

    expect(fixture.componentInstance.passwordMessage()?.type).toBe('success');
  });

  it('persists preference changes', () => {
    fixture.componentInstance.onPreferenceChange('language', 'es');
    fixture.componentInstance.onPreferenceChange('timezone', 'America/New_York');
    fixture.detectChanges();

    expect(settingsService.preferences().language).toBe('es');
    expect(settingsService.preferences().timezone).toBe('America/New_York');
  });

  it('exports settings as JSON', () => {
    settingsService.updateAppearance({ theme: 'dark' });
    const exported = settingsService.exportSettings();
    const parsed = JSON.parse(exported);

    expect(parsed.appearance.theme).toBe('dark');
  });

  it('imports settings from JSON', () => {
    settingsService.updateAppearance({ sidebarBehavior: 'collapsed' });
    const exported = settingsService.exportSettings();

    settingsService.resetSettings();
    expect(settingsService.appearance().sidebarBehavior).toBe('expanded');

    const result = settingsService.importSettings(exported);
    expect(result.success).toBe(true);
    expect(settingsService.appearance().sidebarBehavior).toBe('collapsed');
  });

  it('resets settings to defaults', () => {
    settingsService.updateAppearance({ theme: 'dark' });
    fixture.componentInstance.resetSettings();
    fixture.detectChanges();

    expect(settingsService.settings()).toEqual(DEFAULT_APP_SETTINGS);
    expect(fixture.componentInstance.appMessage()?.text).toContain('reset');
  });

  it('clears cached application data', () => {
    storage['app.auth.token'] = 'token';
    storage['app.theme'] = 'dark';

    fixture.componentInstance.clearCachedData();

    expect(storage['app.auth.token']).toBeUndefined();
    expect(storage['app.theme']).toBeUndefined();
  });

  it('does not contain placeholder text', () => {
    expect(fixture.nativeElement.textContent).not.toContain(
      'Settings panels for notifications',
    );
    expect(fixture.nativeElement.textContent).not.toContain('placeholder');
  });
});
