import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AUTH_CREDENTIALS } from '../../../../core/constants/auth.constants';
import { guestGuard } from '../../../../core/guards/guest.guard';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../../../core/services/auth-storage';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginComponent } from './login.component';

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

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        AuthService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        provideRouter([
          {
            path: 'login',
            component: LoginComponent,
            canActivate: [guestGuard],
          },
          {
            path: 'dashboard',
            loadComponent: async () =>
              (await import('../../../dashboard/dashboard.component'))
                .DashboardComponent,
          },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getEmailInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#email') as HTMLInputElement;
  }

  function getPasswordInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#password') as HTMLInputElement;
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
  }

  it('renders labeled email and password fields with a login button', () => {
    expect(fixture.nativeElement.querySelector('label[for="email"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="password"]'),
    ).toBeTruthy();
    expect(getEmailInput()).toBeTruthy();
    expect(getPasswordInput()).toBeTruthy();
    expect(getSubmitButton().textContent?.trim()).toBe('Sign in');
  });

  it('shows validation messages for empty fields', async () => {
    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const errors = Array.from(
      fixture.nativeElement.querySelectorAll('.field-error'),
    ).map((element) => element.textContent?.trim());

    expect(errors).toContain('Email is required.');
    expect(errors).toContain('Password is required.');
  });

  it('shows a validation message for invalid email format', async () => {
    getEmailInput().value = 'invalid-email';
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = AUTH_CREDENTIALS.password;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const emailError = fixture.nativeElement.querySelector('#email-error');
    expect(emailError?.textContent?.trim()).toBe('Enter a valid email address.');
  });

  it('shows an error message for invalid credentials', async () => {
    vi.useFakeTimers();

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = 'WrongPassword123';
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('.form-alert');
    expect(alert?.textContent?.trim()).toBe('Invalid email or password.');
  });

  it('trims whitespace before submitting credentials', async () => {
    vi.useFakeTimers();

    getEmailInput().value = `  ${AUTH_CREDENTIALS.email}  `;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = `  ${AUTH_CREDENTIALS.password}  `;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/dashboard');
  });

  it('stores auth state and navigates to dashboard on successful login', async () => {
    vi.useFakeTimers();

    const authService = TestBed.inject(AuthService);

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = AUTH_CREDENTIALS.password;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.isAuthenticated()).toBe(true);
    expect(router.url).toBe('/dashboard');
  });

  it('disables the login button while a request is in progress', async () => {
    vi.useFakeTimers();

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = AUTH_CREDENTIALS.password;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    expect(getSubmitButton().disabled).toBe(true);
    expect(getSubmitButton().getAttribute('aria-busy')).toBe('true');

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('ignores duplicate rapid submit attempts', async () => {
    vi.useFakeTimers();

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = AUTH_CREDENTIALS.password;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/dashboard');
  });

  it('blocks navigation back to login when already authenticated', async () => {
    vi.useFakeTimers();

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = AUTH_CREDENTIALS.password;
    getPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    await router.navigateByUrl('/login');
    expect(router.url).toBe('/dashboard');
  });
});
