import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { guestGuard } from '../../../../core/guards/guest.guard';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../../../core/services/auth-storage';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { SignupComponent } from './signup.component';

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

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        AuthService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        provideRouter([
          {
            path: 'signup',
            component: SignupComponent,
            canActivate: [guestGuard],
          },
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

    fixture = TestBed.createComponent(SignupComponent);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/signup');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getFullNameInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#fullName') as HTMLInputElement;
  }

  function getEmailInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#email') as HTMLInputElement;
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

  function fillValidForm(): void {
    getFullNameInput().value = 'Jane Doe';
    getFullNameInput().dispatchEvent(new Event('input'));
    getEmailInput().value = 'jane.doe@example.com';
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = 'SecurePass1';
    getPasswordInput().dispatchEvent(new Event('input'));
    getConfirmPasswordInput().value = 'SecurePass1';
    getConfirmPasswordInput().dispatchEvent(new Event('input'));
  }

  it('renders labeled fields with a Create Account button and Sign In link', () => {
    expect(
      fixture.nativeElement.querySelector('label[for="fullName"]'),
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector('label[for="email"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="password"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="confirmPassword"]'),
    ).toBeTruthy();
    expect(getSubmitButton().textContent?.trim()).toBe('Create Account');
    expect(
      fixture.nativeElement.querySelector('a[href="/login"]'),
    ).toBeTruthy();
  });

  it('shows validation messages for empty fields', async () => {
    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const errors = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.field-error'),
      ) as Element[]
    ).map((element) => element.textContent?.trim());

    expect(errors).toContain('Full name is required.');
    expect(errors).toContain('Email is required.');
    expect(errors).toContain('Password is required.');
    expect(errors).toContain('Please confirm your password.');
  });

  it('shows a validation message for invalid email format', async () => {
    getFullNameInput().value = 'Jane Doe';
    getFullNameInput().dispatchEvent(new Event('input'));
    getEmailInput().value = 'invalid-email';
    getEmailInput().dispatchEvent(new Event('input'));
    getPasswordInput().value = 'SecurePass1';
    getPasswordInput().dispatchEvent(new Event('input'));
    getConfirmPasswordInput().value = 'SecurePass1';
    getConfirmPasswordInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const emailError = fixture.nativeElement.querySelector('#email-error');
    expect(emailError?.textContent?.trim()).toBe('Enter a valid email address.');
  });

  it('shows a validation message when the password is too short', async () => {
    getFullNameInput().value = 'Jane Doe';
    getFullNameInput().dispatchEvent(new Event('input'));
    getEmailInput().value = 'jane.doe@example.com';
    getEmailInput().dispatchEvent(new Event('input'));
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
    getFullNameInput().value = 'Jane Doe';
    getFullNameInput().dispatchEvent(new Event('input'));
    getEmailInput().value = 'jane.doe@example.com';
    getEmailInput().dispatchEvent(new Event('input'));
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

  it('toggles password visibility with accessible labels', () => {
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

  it('stores auth state and navigates to dashboard on successful signup', async () => {
    vi.useFakeTimers();

    const authService = TestBed.inject(AuthService);

    fillValidForm();

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.isAuthenticated()).toBe(true);
    expect(router.url).toBe('/dashboard');
  });

  it('disables the signup button while a request is in progress', async () => {
    vi.useFakeTimers();

    fillValidForm();

    getSubmitButton().click();
    fixture.detectChanges();

    expect(getSubmitButton().disabled).toBe(true);
    expect(getSubmitButton().getAttribute('aria-busy')).toBe('true');

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('navigates to login via the Sign In link', async () => {
    const signInLink = fixture.nativeElement.querySelector(
      'a[href="/login"]',
    ) as HTMLAnchorElement;

    signInLink.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/login');
  });
});
