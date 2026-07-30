import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import { routes } from './app.routes';
import { AUTH_STORAGE } from './core/services/auth-storage';
import { LocalStorageAuthStorage } from './core/services/local-storage-auth-storage';
import { SettingsService } from './core/services/settings.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: AUTH_STORAGE, useClass: LocalStorageAuthStorage },
    provideAppInitializer(() => {
      inject(SettingsService);
      inject(ThemeService);
    }),
  ],
};
