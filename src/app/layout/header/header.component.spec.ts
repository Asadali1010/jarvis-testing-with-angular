import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { ActivityService } from '../../core/services/activity.service';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';
import { HeaderComponent } from './header.component';

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

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let authStorage: InMemoryAuthStorage;

  function getNotificationButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      '[aria-label="View notifications"]',
    ) as HTMLButtonElement;
  }

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
      imports: [HeaderComponent],
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

    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes accessible labels on icon action buttons', () => {
    expect(
      fixture.nativeElement
        .querySelector('.menu-button')
        ?.getAttribute('aria-label'),
    ).toBe('Open navigation menu');

    expect(
      fixture.nativeElement
        .querySelector('.header-actions .icon-button:not(.menu-button)')
        ?.getAttribute('aria-label'),
    ).toBe('View notifications');
  });

  it('updates the theme toggle aria-label based on current theme', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');
    fixture.detectChanges();

    const themeButton = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.header-actions .icon-button'),
      ) as HTMLButtonElement[]
    ).find((button) => button.getAttribute('aria-label')?.includes('mode'))!;

    expect(themeButton.getAttribute('aria-label')).toBe('Switch to dark mode');

    themeService.setTheme('dark');
    fixture.detectChanges();

    expect(themeButton.getAttribute('aria-label')).toBe('Switch to light mode');
  });

  it('keeps the theme toggle button visible in light mode', () => {
    document.documentElement.style.setProperty('--color-text', '#0f172a');
    document.documentElement.style.setProperty('--color-border', '#e2e8f0');

    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');
    TestBed.flushEffects();
    fixture.detectChanges();

    const themeButton = fixture.nativeElement.querySelector(
      '[aria-label="Switch to dark mode"]',
    ) as HTMLButtonElement;

    expect(themeButton).toBeTruthy();
    expect(themeButton.querySelector('svg path')).toBeTruthy();

    const { color } = getComputedStyle(themeButton);
    expect(color).not.toBe('transparent');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('exposes expanded state on the notification bell trigger', () => {
    const trigger = getNotificationButton();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('notification-panel');

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens and closes the notification panel when the bell is clicked', () => {
    const trigger = getNotificationButton();

    expect(fixture.nativeElement.querySelector('#notification-panel')).toBeNull();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#notification-panel')).toBeTruthy();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#notification-panel')).toBeNull();
  });

  it('layers the notification panel above other header content when open', () => {
    getNotificationButton().click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '#notification-panel',
    ) as HTMLElement;

    expect(panel).toBeTruthy();

    const panelStyle = getComputedStyle(panel);
    expect(panelStyle.position).toBe('absolute');
    expect(Number.parseInt(panelStyle.zIndex, 10)).toBeGreaterThanOrEqual(50);
  });

  it('renders notifications from NotificationService in the panel', () => {
    const notificationService = TestBed.inject(NotificationService);
    const notifications = notificationService.notifications();

    expect(notifications.length).toBeGreaterThanOrEqual(1);

    getNotificationButton().click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '#notification-panel',
    ) as HTMLElement;

    expect(panel).toBeTruthy();
    expect(panel.querySelectorAll('.notification-item').length).toBe(
      notifications.length,
    );

    const first = notifications[0]!;
    expect(panel.textContent).toContain(first.title);
    expect(panel.textContent).toContain(first.message);
  });

  it('exposes expanded state on the user menu trigger', () => {
    const trigger = fixture.nativeElement.querySelector(
      '.user-menu-trigger',
    ) as HTMLButtonElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-controls')).toBe('user-menu-panel');

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows profile display name and initials via shared display helpers', () => {
    const avatar = fixture.nativeElement.querySelector('.user-avatar');
    const emailLabel = fixture.nativeElement.querySelector('.user-email');

    expect(avatar?.textContent?.trim()).toBe('AU');
    expect(emailLabel?.textContent?.trim()).toBe('Admin User');
  });

  it('renders avatar image when user has avatar', () => {
    const userService = TestBed.inject(UserService);
    const admin = userService
      .users()
      .find((user) => user.email === AUTH_CREDENTIALS.email);

    expect(admin).toBeTruthy();
    userService.updateUser(admin!.id, {
      avatar: 'data:image/png;base64,header-test',
    });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img.avatar-img') as HTMLImageElement;

    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('data:image/png;base64,header-test');
  });

  it('prevents the header from shrinking in the flex column layout', () => {
    const header = fixture.nativeElement.querySelector('.app-header') as HTMLElement;

    expect(header).toBeTruthy();
    expect(getComputedStyle(header).flexShrink).toBe('0');
  });

  it('keeps header layout stable in dark mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.app-header') as HTMLElement;

    expect(header).toBeTruthy();
    expect(getComputedStyle(header).flexShrink).toBe('0');
  });
});
