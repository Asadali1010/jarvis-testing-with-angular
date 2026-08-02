import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';

import { AUTH_CREDENTIALS } from '../constants/auth.constants';
import { ActivityService } from '../services/activity.service';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../services/auth-storage';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

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

describe('authGuard', () => {
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        provideRouter([]),
      ],
    });
  });

  it('allows access when the user is authenticated', () => {
    const storage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    storage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState),
    );

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});
