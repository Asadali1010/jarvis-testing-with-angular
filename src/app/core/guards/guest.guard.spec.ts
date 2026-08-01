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
import { guestGuard } from './guest.guard';

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

describe('guestGuard', () => {
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/login' } as RouterStateSnapshot;

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

  it('allows access when the user is not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, mockState),
    );

    expect(result).toBe(true);
  });

  it('redirects authenticated users to dashboard', () => {
    const storage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    storage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, mockState),
    );

    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});
