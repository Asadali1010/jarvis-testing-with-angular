import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { AUTH_STORAGE } from './core/services/auth-storage';
import { LocalStorageAuthStorage } from './core/services/local-storage-auth-storage';
import { ThemeService } from './core/services/theme.service';
import { THEME_STORAGE_KEY } from './core/constants/auth.constants';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useClass: LocalStorageAuthStorage },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should restore theme from localStorage on startup', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const themeService = TestBed.inject(ThemeService);
    expect(themeService.theme()).toBe('dark');
  });

  it('should persist theme changes to localStorage', () => {
    const themeService = TestBed.inject(ThemeService);

    themeService.setTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    themeService.toggleTheme();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
