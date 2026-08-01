import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from './auth-storage';
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
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ProfileService);
    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
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
});
