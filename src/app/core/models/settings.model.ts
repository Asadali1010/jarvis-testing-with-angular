export type SettingsThemeMode = 'light' | 'dark' | 'system';

export type SidebarBehavior = 'expanded' | 'collapsed' | 'hover';

export type AppLanguage = 'en' | 'es' | 'fr' | 'de';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export type TimeFormat = '12h' | '24h';

export interface AppearanceSettings {
  theme: SettingsThemeMode;
  sidebarBehavior: SidebarBehavior;
  compactMode: boolean;
  animationsEnabled: boolean;
}

export interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  soundNotifications: boolean;
}

export interface SecuritySettings {
  rememberMe: boolean;
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
}

export interface PreferenceSettings {
  language: AppLanguage;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  preferences: PreferenceSettings;
}

export type SettingsSection = keyof AppSettings;

export type SettingsImportResult =
  | { success: true; settings: AppSettings }
  | { success: false; error: string };

export const SETTINGS_STORAGE_KEY = 'app.settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appearance: {
    theme: 'system',
    sidebarBehavior: 'expanded',
    compactMode: false,
    animationsEnabled: true,
  },
  notifications: {
    browserNotifications: true,
    emailNotifications: false,
    soundNotifications: true,
  },
  security: {
    rememberMe: true,
    sessionTimeoutMinutes: 30,
    twoFactorEnabled: false,
  },
  preferences: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'UTC',
  },
};
