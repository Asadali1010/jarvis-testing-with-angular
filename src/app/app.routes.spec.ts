import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

describe('app routes', () => {
  it('redirects the empty path to dashboard', () => {
    const rootRedirect = routes.find(
      (route) => route.path === '' && route.redirectTo === 'dashboard',
    );

    expect(rootRedirect).toBeTruthy();
    expect(rootRedirect?.pathMatch).toBe('full');
  });

  it('redirects unknown paths to dashboard', () => {
    const wildcard = routes.find((route) => route.path === '**');

    expect(wildcard?.redirectTo).toBe('dashboard');
  });

  it('protects login with guestGuard', () => {
    const loginRoute = routes.find((route) => route.path === 'login');

    expect(loginRoute?.canActivate).toContain(guestGuard);
  });

  it('protects authenticated shell routes with authGuard', () => {
    const shellRoute = routes.find(
      (route) => route.path === '' && route.loadChildren,
    );

    expect(shellRoute?.canActivate).toContain(authGuard);
  });
});
