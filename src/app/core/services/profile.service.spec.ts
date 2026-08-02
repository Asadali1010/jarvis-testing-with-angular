import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from './auth-storage';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { UserService } from './user.service';

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

describe('ProfileService', () => {
  let service: ProfileService;
  let authStorage: InMemoryAuthStorage;
  let activityService: ActivityService;
  let userService: UserService;
  let storage: Record<string, string>;

  beforeEach(() => {
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

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        AuthService,
        UserService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ProfileService);
    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    activityService = TestBed.inject(ActivityService);
    userService = TestBed.inject(UserService);
    activityService.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no user is authenticated', () => {
    expect(service.getProfileForCurrentUser()).toBeNull();
  });

  it('returns the seeded admin profile for the authenticated admin email', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    const profile = service.getProfileForCurrentUser();

    expect(profile).not.toBeNull();
    expect(profile?.email).toBe('admin@example.com');
    expect(profile?.firstName).toBe('Admin');
    expect(profile?.lastName).toBe('User');
    expect(profile?.phone).toBe('+1 (555) 000-0000');
    expect(profile?.address).toBe('123 Enterprise Way, Suite 100');
    expect(profile?.bio).toBe('System administrator for Jarvis Enterprise.');
    expect(profile?.company).toBe('Jarvis Corp');
    expect(profile?.department).toBe('Administration');
    expect(profile?.role).toBe('admin');
  });

  it('returns a fallback profile for authenticated emails not in the user directory', () => {
    authStorage.setToken('mock-token', { email: 'unknown@example.com' });

    const profile = service.getProfileForCurrentUser();

    expect(profile).not.toBeNull();
    expect(profile?.email).toBe('unknown@example.com');
    expect(profile?.firstName).toBe('Admin');
    expect(profile?.lastName).toBe('User');
    expect(profile?.id).toBe('auth-user');
  });

  it('returns an error when updating while unauthenticated', () => {
    expect(
      service.updateProfileForCurrentUser({
        firstName: 'Alex',
        lastName: 'Johnson',
        phone: '+1 (555) 111-2222',
      }),
    ).toEqual({
      success: false,
      error: 'Sign in to update your profile.',
    });
  });

  it('updates a matched user profile', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    const result = service.updateProfileForCurrentUser({
      firstName: 'Alex',
      lastName: 'Johnson',
      phone: '+1 (555) 111-2222',
      address: '456 Updated Ave',
      bio: 'Updated bio',
      company: 'New Corp',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.firstName).toBe('Alex');
      expect(result.user.lastName).toBe('Johnson');
      expect(result.user.phone).toBe('+1 (555) 111-2222');
      expect(result.user.address).toBe('456 Updated Ave');
      expect(result.user.bio).toBe('Updated bio');
      expect(result.user.company).toBe('New Corp');
    }

    const stored = userService
      .users()
      .find((user) => user.email === AUTH_CREDENTIALS.email);
    expect(stored?.firstName).toBe('Alex');
  });

  it('rejects invalid phone numbers', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    expect(
      service.updateProfileForCurrentUser({
        firstName: 'Admin',
        lastName: 'User',
        phone: '123',
      }),
    ).toEqual({
      success: false,
      error: 'Enter a valid phone number.',
    });
  });

  it('rejects empty first name', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    expect(
      service.updateProfileForCurrentUser({
        firstName: '  ',
        lastName: 'User',
        phone: '+1 (555) 000-0000',
      }),
    ).toEqual({
      success: false,
      error: 'First name is required.',
    });
  });

  it('rejects oversized bio input', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    expect(
      service.updateProfileForCurrentUser({
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1 (555) 000-0000',
        bio: 'x'.repeat(501),
      }),
    ).toEqual({
      success: false,
      error: 'Bio must be 500 characters or fewer.',
    });
  });

  it('creates a real user when updating a fallback profile', () => {
    authStorage.setToken('mock-token', { email: 'unknown@example.com' });

    const result = service.updateProfileForCurrentUser({
      firstName: 'New',
      lastName: 'Member',
      phone: '+1 (555) 888-7777',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.id).not.toBe('auth-user');
      expect(result.user.email).toBe('unknown@example.com');
      expect(result.user.firstName).toBe('New');
    }
  });

  it('records a profile_change activity on successful update', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    service.updateProfileForCurrentUser({
      firstName: 'Activity',
      lastName: 'Test',
      phone: '+1 (555) 000-0000',
    });

    expect(activityService.activities()[0]?.type).toBe('profile_change');
    expect(activityService.activities()[0]?.title).toBe('Profile updated');
  });

  it('clears optional fields when empty strings are submitted', () => {
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    const result = service.updateProfileForCurrentUser({
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1 (555) 000-0000',
      address: '   ',
      bio: '',
      company: '  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.address).toBeUndefined();
      expect(result.user.bio).toBeUndefined();
      expect(result.user.company).toBeUndefined();
    }
  });
});
