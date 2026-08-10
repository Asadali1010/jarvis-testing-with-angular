import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { ActivityService } from '../../core/services/activity.service';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';
import { ShellComponent } from './shell.component';

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

describe('ShellComponent fixed-header scroll layout', () => {
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    const storage: Record<string, string> = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
    });

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        AuthService,
        UserService,
        SettingsService,
        ActivityService,
        ThemeService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    const authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
  });

  function assertScrollContainerLayout(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const appMain = root.querySelector('.app-main') as HTMLElement;
    const appContent = root.querySelector('.app-content') as HTMLElement;
    const header = root.querySelector('.app-header') as HTMLElement;

    expect(appMain).toBeTruthy();
    expect(appContent).toBeTruthy();
    expect(header).toBeTruthy();

    expect(getComputedStyle(appContent).overflowY).toBe('auto');
    expect(appContent.contains(header)).toBe(false);

    const mainChildren = Array.from(appMain.children);
    const headerHost = mainChildren.find(
      (child) => child.tagName.toLowerCase() === 'app-header',
    );
    const contentIndex = mainChildren.indexOf(appContent);

    expect(headerHost).toBeTruthy();
    expect(mainChildren.indexOf(headerHost!)).toBeLessThan(contentIndex);
  }

  it('uses .app-content as the scroll container in light mode', () => {
    assertScrollContainerLayout('light');
  });

  it('uses .app-content as the scroll container in dark mode', () => {
    assertScrollContainerLayout('dark');
  });

  it('keeps the header outside the scroll region in light mode', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    fixture.detectChanges();

    const appContent = fixture.nativeElement.querySelector('.app-content') as HTMLElement;
    const headerHost = fixture.nativeElement.querySelector('app-header') as HTMLElement;

    expect(appContent.contains(headerHost)).toBe(false);
    expect(appContent.querySelector('.app-header')).toBeNull();
  });

  it('keeps the header outside the scroll region in dark mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    fixture.detectChanges();

    const appContent = fixture.nativeElement.querySelector('.app-content') as HTMLElement;
    const headerHost = fixture.nativeElement.querySelector('app-header') as HTMLElement;

    expect(appContent.contains(headerHost)).toBe(false);
    expect(appContent.querySelector('.app-header')).toBeNull();
  });

  it('keeps .app-main overflow visible so header dropdowns are not clipped', () => {
    const appMain = fixture.nativeElement.querySelector('.app-main') as HTMLElement;

    expect(appMain).toBeTruthy();
    expect(getComputedStyle(appMain).overflow).toBe('visible');
  });
});
