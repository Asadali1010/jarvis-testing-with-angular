import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';
import { AUTH_CREDENTIALS } from './core/constants/auth.constants';
import { ActivityService } from './core/services/activity.service';
import { AUTH_STORAGE, AuthStorage, AuthUser } from './core/services/auth-storage';
import { AuthService } from './core/services/auth.service';

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

describe('app routes', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useValue: new InMemoryAuthStorage() },
        provideRouter(routes),
      ],
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function login(): Promise<void> {
    vi.useFakeTimers();
    const loginPromise = authService.login(
      AUTH_CREDENTIALS.email,
      AUTH_CREDENTIALS.password,
    );
    await vi.advanceTimersByTimeAsync(300);
    await loginPromise;
  }

  it('redirects unauthenticated users from protected routes to login', async () => {
    await router.navigateByUrl('/dashboard');
    expect(router.url).toBe('/login');
  });

  it('redirects unauthenticated users from nested protected routes to login', async () => {
    await router.navigateByUrl('/users');
    expect(router.url).toBe('/login');

    await router.navigateByUrl('/settings');
    expect(router.url).toBe('/login');

    await router.navigateByUrl('/profile');
    expect(router.url).toBe('/login');
  });

  it('allows unauthenticated users to access the login route', async () => {
    await router.navigateByUrl('/login');
    expect(router.url).toBe('/login');
  });

  it('redirects authenticated users away from guest routes to dashboard', async () => {
    await login();

    await router.navigateByUrl('/login');
    expect(router.url).toBe('/dashboard');
  });

  it('allows authenticated users to access protected routes', async () => {
    await login();

    await router.navigateByUrl('/dashboard');
    expect(router.url).toBe('/dashboard');

    await router.navigateByUrl('/users');
    expect(router.url).toBe('/users');
  });

  it('redirects the root path to dashboard when authenticated', async () => {
    await login();

    await router.navigateByUrl('/');
    expect(router.url).toBe('/dashboard');
  });

  it('redirects unknown paths to dashboard when authenticated', async () => {
    await login();

    await router.navigateByUrl('/unknown-route');
    expect(router.url).toBe('/dashboard');
  });
});
