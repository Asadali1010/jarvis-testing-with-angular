import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
  AUTH_CREDENTIALS,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_TOKEN_STORAGE_KEY,
} from '../../../../core/constants/auth.constants';
import { guestGuard } from '../../../../core/guards/guest.guard';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../../../core/services/auth-storage';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { ForgotPasswordComponent } from './forgot-password.component';

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

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let router: Router;
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
      imports: [ForgotPasswordComponent],
      providers: [
        AuthService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([
          {
            path: 'forgot-password',
            component: ForgotPasswordComponent,
            canActivate: [guestGuard],
          },
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
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/forgot-password');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function getEmailInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#email') as HTMLInputElement;
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
  }

  it('renders labeled email field with a submit button and Sign in link', () => {
    expect(fixture.nativeElement.querySelector('label[for="email"]')).toBeTruthy();
    expect(getEmailInput()).toBeTruthy();
    expect(getSubmitButton().textContent?.trim()).toBe('Send reset instructions');
    expect(
      fixture.nativeElement.querySelector('a[href="/login"]'),
    ).toBeTruthy();
  });

  it('shows validation messages for empty email', async () => {
    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const emailError = fixture.nativeElement.querySelector('#email-error');
    expect(emailError?.textContent?.trim()).toBe('Email is required.');
  });

  it('shows a validation message for invalid email format', async () => {
    getEmailInput().value = 'invalid-email';
    getEmailInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    const emailError = fixture.nativeElement.querySelector('#email-error');
    expect(emailError?.textContent?.trim()).toBe('Enter a valid email address.');
  });

  it('shows a success message and continue link after a valid reset request', async () => {
    vi.useFakeTimers();

    getEmailInput().value = AUTH_CREDENTIALS.email;
    getEmailInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    const successAlert = fixture.nativeElement.querySelector('.form-alert-success');
    expect(successAlert?.textContent?.trim()).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    const stored = JSON.parse(
      localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY] ?? '{}',
    );
    expect(stored.token).toBeTruthy();

    const continueLink = fixture.nativeElement.querySelector(
      'a.forgot-password-continue',
    ) as HTMLAnchorElement;
    expect(continueLink).toBeTruthy();
    expect(continueLink.textContent?.trim()).toBe('Continue to reset password');
    expect(continueLink.getAttribute('href')).toContain('/reset-password');
    expect(continueLink.getAttribute('href')).toContain(
      encodeURIComponent(stored.token),
    );
  });

  it('shows a success message without a continue link for unknown emails', async () => {
    vi.useFakeTimers();

    getEmailInput().value = 'unknown@example.com';
    getEmailInput().dispatchEvent(new Event('input'));

    getSubmitButton().click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    await fixture.whenStable();

    const successAlert = fixture.nativeElement.querySelector('.form-alert-success');
    expect(successAlert?.textContent?.trim()).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
    expect(
      fixture.nativeElement.querySelector('a.forgot-password-continue'),
    ).toBeNull();
    expect(localStore[PASSWORD_RESET_TOKEN_STORAGE_KEY]).toBeUndefined();
  });
});
