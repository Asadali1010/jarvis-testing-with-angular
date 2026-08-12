import { PLATFORM_ID, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';

import {
  AUTH_CREDENTIALS,
  PASSWORD_RESET_COMPLETE_MESSAGE,
  PASSWORD_RESET_TOKEN_STORAGE_KEY,
} from '../../../../core/constants/auth.constants';
import { guestGuard } from '../../../../core/guards/guest.guard';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../../../core/services/auth-storage';
import { AuthService } from '../../../../core/services/auth.service';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { LoginComponent } from '../login/login.component';
import { ResetPasswordComponent } from './reset-password.component';

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

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class TestHostComponent {}

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let router: Router;
  let authService: AuthService;
  let localStore: Record<string, string>;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        AuthService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([
          {
            path: 'reset-password',
            component: ResetPasswordComponent,
            canActivate: [guestGuard],
          },
          {
            path: 'login',
            component: LoginComponent,
            canActivate: [guestGuard],
          },
          {
            path: 'forgot-password',
            component: ForgotPasswordComponent,
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

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function createComponentWithToken(token?: string): Promise<void> {
    const url = token
      ? `/reset-password?token=${encodeURIComponent(token)}`
      : '/reset-password';

    fixture = TestBed.createComponent(TestHostComponent);
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  async function issueResetToken(): Promise<string> {
    vi.useFakeTimers();

    const requestPromise = authService.requestPasswordReset(AUTH_CREDENTIALS.email);
    await vi.advanceTimersByTimeAsync(300);
    await requestPromise;

    const stored = JSON.parse(
      localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY] ?? '{}',
    );
    return stored.token as string;
  }

  function getPasswordInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#password') as HTMLInputElement;
  }

  function getConfirmPasswordInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      '#confirmPassword',
    ) as HTMLInputElement;
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
  }

  function fillValidForm(password = 'NewSecure1!'): void {
    getPasswordInput().value = password;
    getPasswordInput().dispatchEvent(new Event('input'));
    getConfirmPasswordInput().value = password;
    getConfirmPasswordInput().dispatchEvent(new Event('input'));
  }

  it('shows an error and forgot-password link when the token query param is missing', async () => {
    await createComponentWithToken();

    const alert = fixture.nativeElement.querySelector('.form-alert');
    expect(alert?.textContent?.trim()).toBe('Invalid or missing reset link.');
    expect(
      fixture.nativeElement.querySelector('a[href="/forgot-password"]'),
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('renders password fields with a submit button when a token is present', async () => {
    await createComponentWithToken('sample-token');

    expect(
      fixture.nativeElement.querySelector('label[for="password"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="confirmPassword"]'),
    ).toBeTruthy();
    expect(getSubmitButton().textContent?.trim()).toBe('Reset password');
    expect(
      fixture.nativeElement.querySelector('a[href="/login"]'),
    ).toBeTruthy();
  });

  it('shows validation messages for empty fields', async () => {
    await createComponentWithToken('sample-token');

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const errors = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.field-error'),
      ) as Element[]
    ).map((element) => element.textContent?.trim());

    expect(errors).toContain('Password is required.');
    expect(errors).toContain('Please confirm your password.');
  });

  it('shows a validation message when the password is too short', async () => {
    await createComponentWithToken('sample-token');

    getPasswordInput().value = 'short';
    getPasswordInput().dispatchEvent(new Event('input'));
    getConfirmPasswordInput().value = 'short';
    getConfirmPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const passwordError = fixture.nativeElement.querySelector('#password-error');
    expect(passwordError?.textContent?.trim()).toBe(
      'Password must be at least 8 characters.',
    );
  });

  it('shows a validation message when passwords do not match', async () => {
    await createComponentWithToken('sample-token');

    getPasswordInput().value = 'SecurePass1';
    getPasswordInput().dispatchEvent(new Event('input'));
    getConfirmPasswordInput().value = 'DifferentPass1';
    getConfirmPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const confirmPasswordError = fixture.nativeElement.querySelector(
      '#confirmPassword-error',
    );
    expect(confirmPasswordError?.textContent?.trim()).toBe(
      'Passwords do not match.',
    );
  });

  it('toggles password visibility with accessible labels', async () => {
    await createComponentWithToken('sample-token');

    const passwordToggle = fixture.nativeElement.querySelector(
      '#password-toggle',
    ) as HTMLButtonElement;
    const confirmPasswordToggle = fixture.nativeElement.querySelector(
      '#confirm-password-toggle',
    ) as HTMLButtonElement;

    expect(getPasswordInput().type).toBe('password');
    expect(passwordToggle.getAttribute('aria-label')).toBe('Show password');

    passwordToggle.click();
    fixture.detectChanges();

    expect(getPasswordInput().type).toBe('text');
    expect(passwordToggle.getAttribute('aria-label')).toBe('Hide password');

    expect(getConfirmPasswordInput().type).toBe('password');
    expect(confirmPasswordToggle.getAttribute('aria-label')).toBe(
      'Show password',
    );

    confirmPasswordToggle.click();
    fixture.detectChanges();

    expect(getConfirmPasswordInput().type).toBe('text');
    expect(confirmPasswordToggle.getAttribute('aria-label')).toBe(
      'Hide password',
    );
  });

  it('shows an error and forgot-password link for an invalid token on submit', async () => {
    await createComponentWithToken('invalid-token');

    fillValidForm();
    vi.useFakeTimers();

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('.form-alert');
    expect(alert?.textContent?.trim()).toBe('Invalid or expired reset token.');
    expect(
      fixture.nativeElement.querySelector('a[href="/forgot-password"]'),
    ).toBeTruthy();
  });

  it('resets the password, navigates to login with success feedback, and allows sign-in', async () => {
    const resetToken = await issueResetToken();
    await createComponentWithToken(resetToken);

    const newPassword = 'NewSecure1!';
    fillValidForm(newPassword);

    vi.useFakeTimers();
    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/login?reset=success');

    const successAlert = fixture.nativeElement.querySelector(
      '.form-alert-success',
    );
    expect(successAlert?.textContent?.trim()).toBe(
      PASSWORD_RESET_COMPLETE_MESSAGE,
    );

    const emailInput = fixture.nativeElement.querySelector(
      '#email',
    ) as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement;
    const loginButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    emailInput.value = AUTH_CREDENTIALS.email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = newPassword;
    passwordInput.dispatchEvent(new Event('input'));

    loginButton.click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.isAuthenticated()).toBe(true);
  });
});
