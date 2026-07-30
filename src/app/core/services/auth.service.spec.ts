import { TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from './auth-storage';
import { AuthService } from './auth.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let storage: InMemoryAuthStorage;

  beforeEach(() => {
    storage = new InMemoryAuthStorage();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_STORAGE, useValue: storage },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('authenticates valid credentials and stores auth state', async () => {
    vi.useFakeTimers();

    const loginPromise = service.login(
      AUTH_CREDENTIALS.email,
      AUTH_CREDENTIALS.password,
    );

    await vi.advanceTimersByTimeAsync(300);
    const result = await loginPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe(AUTH_CREDENTIALS.email);
    }
    expect(service.isAuthenticated()).toBe(true);
    expect(storage.getToken()).toBeTruthy();
    expect(storage.getUser()?.email).toBe(AUTH_CREDENTIALS.email);
  });

  it('rejects empty email', async () => {
    const result = await service.login('   ', AUTH_CREDENTIALS.password);

    expect(result).toEqual({ success: false, error: 'Email is required.' });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rejects empty password', async () => {
    const result = await service.login(AUTH_CREDENTIALS.email, '   ');

    expect(result).toEqual({ success: false, error: 'Password is required.' });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rejects invalid email format', async () => {
    const result = await service.login('not-an-email', AUTH_CREDENTIALS.password);

    expect(result).toEqual({
      success: false,
      error: 'Enter a valid email address.',
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rejects invalid credentials', async () => {
    vi.useFakeTimers();

    const loginPromise = service.login(
      AUTH_CREDENTIALS.email,
      'WrongPassword123',
    );

    await vi.advanceTimersByTimeAsync(300);
    const result = await loginPromise;

    expect(result).toEqual({
      success: false,
      error: 'Invalid email or password.',
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('trims whitespace from credentials before validating', async () => {
    vi.useFakeTimers();

    const loginPromise = service.login(
      `  ${AUTH_CREDENTIALS.email}  `,
      `  ${AUTH_CREDENTIALS.password}  `,
    );

    await vi.advanceTimersByTimeAsync(300);
    const result = await loginPromise;

    expect(result.success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('prevents duplicate login requests while one is in progress', async () => {
    vi.useFakeTimers();

    const firstRequest = service.login(
      AUTH_CREDENTIALS.email,
      AUTH_CREDENTIALS.password,
    );
    const secondRequest = service.login(
      AUTH_CREDENTIALS.email,
      AUTH_CREDENTIALS.password,
    );

    expect(service.isLoading()).toBe(true);

    const duplicateResult = await secondRequest;
    expect(duplicateResult).toEqual({
      success: false,
      error: 'A login request is already in progress.',
    });

    await vi.advanceTimersByTimeAsync(300);
    const firstResult = await firstRequest;

    expect(firstResult.success).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('clears auth state on logout', async () => {
    vi.useFakeTimers();

    const loginPromise = service.login(
      AUTH_CREDENTIALS.email,
      AUTH_CREDENTIALS.password,
    );
    await vi.advanceTimersByTimeAsync(300);
    await loginPromise;

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(storage.getToken()).toBeNull();
    expect(storage.getUser()).toBeNull();
  });
});
