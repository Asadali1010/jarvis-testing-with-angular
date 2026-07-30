import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ProfileComponent } from './profile.component';

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

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let authStorage: InMemoryAuthStorage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        AuthService,
        UserService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function getDetailValue(label: string): string | undefined {
    const items = fixture.nativeElement.querySelectorAll('.profile-details > div');
    for (const item of Array.from(items) as HTMLElement[]) {
      const dt = item.querySelector('dt');
      if (dt?.textContent?.trim() === label) {
        return item.querySelector('dd')?.textContent?.trim();
      }
    }
    return undefined;
  }

  it('displays profile avatar and name for the authenticated user', () => {
    expect(fixture.nativeElement.querySelector('.profile-avatar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.profile-name')?.textContent?.trim()).toBe(
      'Admin User',
    );
  });

  it('displays email, phone, address, bio, company, department, role, and member since', () => {
    expect(getDetailValue('Email')).toBe(AUTH_CREDENTIALS.email);
    expect(getDetailValue('Phone')).toBe('+1 (555) 000-0000');
    expect(getDetailValue('Address')).toBe('123 Enterprise Way, Suite 100');
    expect(getDetailValue('Bio')).toBe('System administrator for Jarvis Enterprise.');
    expect(getDetailValue('Company')).toBe('Jarvis Corp');
    expect(getDetailValue('Department')).toBe('Administration');
    expect(getDetailValue('Role')).toBe('Administrator');
    expect(getDetailValue('Member since')).toBeTruthy();
  });

  it('does not contain placeholder text', () => {
    expect(fixture.nativeElement.textContent).not.toContain('will appear here');
    expect(fixture.nativeElement.textContent).not.toContain('placeholder');
  });

  it('shows a sign-in message when no authenticated user is available', () => {
    authStorage.clear();
    TestBed.inject(AuthService).logout();
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.profile-empty')?.textContent).toContain(
      'Sign in to view your profile information',
    );
  });
});
