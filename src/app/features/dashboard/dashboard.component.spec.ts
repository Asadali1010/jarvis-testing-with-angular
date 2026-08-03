import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { DashboardComponent } from './dashboard.component';

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

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let authStorage: InMemoryAuthStorage;

  beforeEach(async () => {
    authStorage = new InMemoryAuthStorage();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        AuthService,
        UserService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    vi.unstubAllGlobals();
  });

  function getText(selector: string): string | undefined {
    return fixture.nativeElement.querySelector(selector)?.textContent?.trim();
  }

  it('renders a welcome hero with personalized greeting', () => {
    const greeting = fixture.nativeElement.querySelector('.hero-greeting');
    expect(greeting).toBeTruthy();
    expect(greeting?.textContent?.trim()).toMatch(/Good (morning|afternoon|evening), Admin/);
  });

  it('displays live date and time', () => {
    const datetime = fixture.nativeElement.querySelector('.hero-datetime');
    expect(datetime).toBeTruthy();
    expect(datetime?.getAttribute('datetime')).toBeTruthy();
    expect(datetime?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('shows logged-in user information', () => {
    const userBlock = fixture.nativeElement.querySelector('.hero-user');
    expect(userBlock).toBeTruthy();
    expect(getText('.hero-user-email')).toBe(AUTH_CREDENTIALS.email);
  });

  it('renders five statistic cards with titles and values', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
    expect(cards.length).toBe(5);

    const titles = Array.from(cards).map((card) =>
      card.querySelector('.stat-card-title')?.textContent?.trim(),
    );

    expect(titles).toEqual([
      'Total Users',
      'Active Users',
      'Inactive Users',
      'New Users',
      'System Status',
    ]);

    const systemStatusCard = cards[4];
    expect(
      systemStatusCard.querySelector('.stat-card-value')?.textContent?.trim(),
    ).toBe('Operational');
  });

  it('renders quick action shortcuts', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.quick-action-label'),
    ).map((element) => element.textContent?.trim());

    expect(links).toEqual(['Add User', 'View Users', 'Edit Profile', 'Open Settings']);
  });

  it('renders four reusable dashboard widgets', () => {
    const widgets = fixture.nativeElement.querySelectorAll('app-dashboard-widget');
    expect(widgets.length).toBe(4);

    const widgetTitles = Array.from(widgets).map((widget) =>
      widget.querySelector('.dashboard-widget-title')?.textContent?.trim(),
    );

    expect(widgetTitles).toEqual([
      'System Information',
      'Latest Updates',
      'Recent Activity',
      'User Overview',
    ]);
  });

  it('shows an activity timeline with empty state when no events exist', () => {
    const emptyState = fixture.nativeElement.querySelector('.activity-empty');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No recent activity yet');
  });

  it('shows activity timeline entries after events are recorded', async () => {
    const activityService = TestBed.inject(ActivityService);
    activityService.recordLogin('Admin User');

    fixture.detectChanges();
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('.activity-item');
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('User signed in');
  });

  it('does not contain placeholder text', () => {
    expect(fixture.nativeElement.textContent).not.toContain(
      'Dashboard widgets and analytics will appear here',
    );
    expect(fixture.nativeElement.textContent).not.toContain('placeholder');
  });
});
