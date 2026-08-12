import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AUTH_CREDENTIALS,
  PASSWORD_OVERRIDE_STORAGE_KEY,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_TOKEN_STORAGE_KEY,
} from '../constants/auth.constants';
import { ActivityService } from './activity.service';
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
  let localStore: Record<string, string>;

  beforeEach(() => {
    storage = new InMemoryAuthStorage();
    localStore = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStore[key];
      },
      clear: () => {
        localStore = {};
      },
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useValue: storage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

  describe('requestPasswordReset', () => {
    it('stores a time-limited token for the registered email and returns a generic success message', async () => {
      vi.useFakeTimers();

      const requestPromise = service.requestPasswordReset(AUTH_CREDENTIALS.email);
      await vi.advanceTimersByTimeAsync(300);
      const result = await requestPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
        expect(result.resetToken).toBeTruthy();
      }

      const stored = JSON.parse(
        localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY] ?? '{}',
      );
      expect(stored.token).toBeTruthy();
      if (result.success && result.resetToken) {
        expect(stored.token).toBe(result.resetToken);
      }
      expect(stored.expiresAt).toBeGreaterThan(Date.now());
    });

    it('returns the same generic success message for unknown emails without storing a token', async () => {
      vi.useFakeTimers();

      const requestPromise = service.requestPasswordReset('unknown@example.com');
      await vi.advanceTimersByTimeAsync(300);
      const result = await requestPromise;

      expect(result).toEqual({
        success: true,
        message: PASSWORD_RESET_SUCCESS_MESSAGE,
      });
      if (result.success) {
        expect(result.resetToken).toBeUndefined();
      }
      expect(localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY]).toBeUndefined();
    });

    it('rejects empty email', async () => {
      const result = await service.requestPasswordReset('   ');

      expect(result).toEqual({ success: false, error: 'Email is required.' });
    });

    it('rejects invalid email format', async () => {
      const result = await service.requestPasswordReset('not-an-email');

      expect(result).toEqual({
        success: false,
        error: 'Enter a valid email address.',
      });
    });

    it('prevents duplicate password reset requests while one is in progress', async () => {
      vi.useFakeTimers();

      const firstRequest = service.requestPasswordReset(AUTH_CREDENTIALS.email);
      const secondRequest = service.requestPasswordReset(AUTH_CREDENTIALS.email);

      expect(service.isLoading()).toBe(true);

      const duplicateResult = await secondRequest;
      expect(duplicateResult).toEqual({
        success: false,
        error: 'A password reset request is already in progress.',
      });

      await vi.advanceTimersByTimeAsync(300);
      const firstResult = await firstRequest;

      expect(firstResult.success).toBe(true);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('resetPassword', () => {
    async function issueResetToken(): Promise<string> {
      vi.useFakeTimers();
      const requestPromise = service.requestPasswordReset(AUTH_CREDENTIALS.email);
      await vi.advanceTimersByTimeAsync(300);
      await requestPromise;

      const stored = JSON.parse(
        localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY] ?? '{}',
      );
      return stored.token as string;
    }

    it('resets the password, clears the token, and allows login with the new password', async () => {
      const resetToken = await issueResetToken();
      const newPassword = 'NewSecure1!';

      vi.useFakeTimers();
      const resetPromise = service.resetPassword(
        resetToken,
        newPassword,
        newPassword,
      );
      await vi.advanceTimersByTimeAsync(300);
      const resetResult = await resetPromise;

      expect(resetResult).toEqual({ success: true });
      expect(localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY]).toBeUndefined();
      expect(localStore[PASSWORD_OVERRIDE_STORAGE_KEY]).toBe(newPassword);

      const loginPromise = service.login(AUTH_CREDENTIALS.email, newPassword);
      await vi.advanceTimersByTimeAsync(300);
      const loginResult = await loginPromise;

      expect(loginResult.success).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('rejects an invalid reset token', async () => {
      await issueResetToken();

      vi.useFakeTimers();
      const resetPromise = service.resetPassword(
        'invalid-token',
        'NewSecure1!',
        'NewSecure1!',
      );
      await vi.advanceTimersByTimeAsync(300);
      const result = await resetPromise;

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    });

    it('rejects an expired reset token', async () => {
      localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY] = JSON.stringify({
        token: 'expired-token',
        expiresAt: Date.now() - 1,
      });

      vi.useFakeTimers();
      const resetPromise = service.resetPassword(
        'expired-token',
        'NewSecure1!',
        'NewSecure1!',
      );
      await vi.advanceTimersByTimeAsync(300);
      const result = await resetPromise;

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired reset token.',
      });
      expect(localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY]).toBeUndefined();
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const resetToken = await issueResetToken();

      vi.useFakeTimers();
      const resetPromise = service.resetPassword(
        resetToken,
        'short',
        'short',
      );
      await vi.advanceTimersByTimeAsync(300);
      const result = await resetPromise;

      expect(result).toEqual({
        success: false,
        error: 'Password must be at least 8 characters.',
      });
    });

    it('rejects mismatched passwords', async () => {
      const resetToken = await issueResetToken();

      vi.useFakeTimers();
      const resetPromise = service.resetPassword(
        resetToken,
        'NewSecure1!',
        'Different1!',
      );
      await vi.advanceTimersByTimeAsync(300);
      const result = await resetPromise;

      expect(result).toEqual({
        success: false,
        error: 'Passwords do not match.',
      });
    });

    it('prevents duplicate reset requests while one is in progress', async () => {
      const resetToken = await issueResetToken();

      vi.useFakeTimers();

      const firstRequest = service.resetPassword(
        resetToken,
        'NewSecure1!',
        'NewSecure1!',
      );
      const secondRequest = service.resetPassword(
        resetToken,
        'NewSecure1!',
        'NewSecure1!',
      );

      expect(service.isLoading()).toBe(true);

      const duplicateResult = await secondRequest;
      expect(duplicateResult).toEqual({
        success: false,
        error: 'A password reset request is already in progress.',
      });

      await vi.advanceTimersByTimeAsync(300);
      const firstResult = await firstRequest;

      expect(firstResult.success).toBe(true);
      expect(service.isLoading()).toBe(false);
    });
  });
});
