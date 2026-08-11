import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
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

    authStorage = new InMemoryAuthStorage();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        AuthService,
        UserService,
        ActivityService,
        TicketService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    TestBed.inject(ActivityService).clear();
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

  function getWidgetTitles(): string[] {
    return (
      Array.from(
        fixture.nativeElement.querySelectorAll('app-dashboard-widget'),
      ) as Element[]
    ).map((widget) =>
      widget.querySelector('.dashboard-widget-title')?.textContent?.trim(),
    );
  }

  function getWidgetByTitle(title: string): Element | undefined {
    return (
      Array.from(
        fixture.nativeElement.querySelectorAll('app-dashboard-widget'),
      ) as Element[]
    ).find(
      (widget) =>
        widget.querySelector('.dashboard-widget-title')?.textContent?.trim() ===
        title,
    );
  }

  function getInfoListValue(widget: Element, label: string): string | undefined {
    const rows = Array.from(widget.querySelectorAll('.info-list div')) as Element[];
    const row = rows.find((entry) => getTextFrom(entry, 'dt') === label);
    return row ? getTextFrom(row, 'dd') : undefined;
  }

  function getTextFrom(parent: Element, selector: string): string | undefined {
    return parent.querySelector(selector)?.textContent?.trim();
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
    expect(getText('.hero-user-name')).toBe('Admin User');
    expect(getText('.hero-user-avatar')).toBe('AU');
    expect(getText('.hero-user-email')).toBe(AUTH_CREDENTIALS.email);
  });

  it('renders five statistic cards with titles and values', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
    expect(cards.length).toBe(5);

    const titles = (Array.from(cards) as Element[]).map((card) =>
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
    const links = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.quick-action-label'),
      ) as Element[]
    ).map((element) => element.textContent?.trim());

    expect(links).toEqual(['Add User', 'View Users', 'Edit Profile', 'Open Settings']);
  });

  it('renders seven reusable dashboard widgets', () => {
    const widgets = fixture.nativeElement.querySelectorAll('app-dashboard-widget');
    expect(widgets.length).toBeGreaterThanOrEqual(7);

    const widgetTitles = getWidgetTitles();

    expect(widgetTitles).toEqual([
      'System Information',
      'Latest Updates',
      'Recent Activity',
      'User Overview',
      'Support Tickets',
      'Notifications',
      'Team by Department',
    ]);
  });

  it('shows support ticket status counts from TicketService seed data', () => {
    const ticketService = TestBed.inject(TicketService);
    const tickets = ticketService.tickets();
    const expectedCounts = {
      Open: tickets.filter((ticket) => ticket.status === 'open').length,
      'In progress': tickets.filter((ticket) => ticket.status === 'in-progress')
        .length,
      Done: tickets.filter((ticket) => ticket.status === 'done').length,
    };

    const supportWidget = getWidgetByTitle('Support Tickets');
    expect(supportWidget).toBeTruthy();

    expect(getInfoListValue(supportWidget!, 'Open')).toBe(
      expectedCounts.Open.toString(),
    );
    expect(getInfoListValue(supportWidget!, 'In progress')).toBe(
      expectedCounts['In progress'].toString(),
    );
    expect(getInfoListValue(supportWidget!, 'Done')).toBe(
      expectedCounts.Done.toString(),
    );
  });

  it('lists expected departments in the team breakdown widget', () => {
    const userService = TestBed.inject(UserService);
    const expectedDepartments = [
      ...new Set(userService.users().map((user) => user.department)),
    ].sort();

    const departmentWidget = getWidgetByTitle('Team by Department');
    expect(departmentWidget).toBeTruthy();

    const departmentNames = (
      Array.from(
        departmentWidget!.querySelectorAll('.department-name'),
      ) as Element[]
    ).map((element) => element.textContent?.trim());

    expect(departmentNames.length).toBe(expectedDepartments.length);
    expect(departmentNames.sort()).toEqual(expectedDepartments);
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
