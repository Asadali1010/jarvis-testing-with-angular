import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import {
  AUTH_CREDENTIALS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_OVERRIDE_STORAGE_KEY,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  PASSWORD_RESET_TOKEN_STORAGE_KEY,
} from '../constants/auth.constants';
import { ActivityService } from './activity.service';
import { AUTH_STORAGE, AuthUser } from './auth-storage';

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

export type SignupResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

export type PasswordResetRequestResult =
  | { success: true; message: string; resetToken?: string }
  | { success: false; error: string };

export type PasswordResetResult =
  | { success: true }
  | { success: false; error: string };

interface StoredPasswordResetToken {
  token: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(AUTH_STORAGE);
  private readonly activityService = inject(ActivityService);

  private readonly token = signal<string | null>(this.storage.getToken());
  private readonly user = signal<AuthUser | null>(this.storage.getUser());
  readonly isLoading = signal(false);

  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly currentUser = computed(() => this.user());

  async login(email: string, password: string): Promise<LoginResult> {
    if (this.isLoading()) {
      return { success: false, error: 'A login request is already in progress.' };
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Email is required.' };
    }

    if (!trimmedPassword) {
      return { success: false, error: 'Password is required.' };
    }

    if (!this.isValidEmail(trimmedEmail)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    this.isLoading.set(true);

    try {
      await this.simulateNetworkDelay();

      if (
        trimmedEmail !== AUTH_CREDENTIALS.email ||
        trimmedPassword !== this.getEffectivePassword()
      ) {
        return { success: false, error: 'Invalid email or password.' };
      }

      const authenticatedUser: AuthUser = { email: trimmedEmail };
      const token = this.createMockToken(authenticatedUser);

      this.storage.setToken(token, authenticatedUser);
      this.token.set(token);
      this.user.set(authenticatedUser);

      const displayName =
        trimmedEmail.split('@')[0]?.replace(/\./g, ' ') ?? trimmedEmail;
      this.activityService.recordLogin(displayName);

      return { success: true, user: authenticatedUser };
    } finally {
      this.isLoading.set(false);
    }
  }

  async signup(
    fullName: string,
    email: string,
    password: string,
  ): Promise<SignupResult> {
    if (this.isLoading()) {
      return {
        success: false,
        error: 'A signup request is already in progress.',
      };
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Email is required.' };
    }

    if (!trimmedPassword) {
      return { success: false, error: 'Password is required.' };
    }

    if (!this.isValidEmail(trimmedEmail)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    if (trimmedPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters.',
      };
    }

    this.isLoading.set(true);

    try {
      await this.simulateNetworkDelay();

      const authenticatedUser: AuthUser = {
        email: trimmedEmail,
        ...(trimmedFullName ? { displayName: trimmedFullName } : {}),
      };
      const token = this.createMockToken(authenticatedUser);

      this.storage.setToken(token, authenticatedUser);
      this.token.set(token);
      this.user.set(authenticatedUser);

      return { success: true, user: authenticatedUser };
    } finally {
      this.isLoading.set(false);
    }
  }

  logout(): void {
    this.storage.clear();
    this.token.set(null);
    this.user.set(null);
  }

  async requestPasswordReset(
    email: string,
  ): Promise<PasswordResetRequestResult> {
    if (this.isLoading()) {
      return {
        success: false,
        error: 'A password reset request is already in progress.',
      };
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Email is required.' };
    }

    if (!this.isValidEmail(trimmedEmail)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    this.isLoading.set(true);

    try {
      await this.simulateNetworkDelay();

      let resetToken: string | undefined;

      if (trimmedEmail === AUTH_CREDENTIALS.email) {
        resetToken = this.createPasswordResetToken();
        this.storePasswordResetToken(resetToken);
      }

      return {
        success: true,
        message: PASSWORD_RESET_SUCCESS_MESSAGE,
        ...(resetToken ? { resetToken } : {}),
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<PasswordResetResult> {
    if (this.isLoading()) {
      return {
        success: false,
        error: 'A password reset request is already in progress.',
      };
    }

    const trimmedToken = token.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedToken) {
      return { success: false, error: 'Reset token is required.' };
    }

    if (!trimmedPassword) {
      return { success: false, error: 'Password is required.' };
    }

    if (!trimmedConfirmPassword) {
      return { success: false, error: 'Confirm password is required.' };
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    this.isLoading.set(true);

    try {
      await this.simulateNetworkDelay();

      const storedToken = this.readPasswordResetToken();
      if (!storedToken || storedToken.token !== trimmedToken) {
        return { success: false, error: 'Invalid or expired reset token.' };
      }

      if (Date.now() > storedToken.expiresAt) {
        this.clearPasswordResetToken();
        return { success: false, error: 'Invalid or expired reset token.' };
      }

      this.storePasswordOverride(trimmedPassword);
      this.clearPasswordResetToken();

      return { success: true };
    } finally {
      this.isLoading.set(false);
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private createMockToken(user: AuthUser): string {
    return btoa(JSON.stringify({ sub: user.email, iat: Date.now() }));
  }

  private simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  private getEffectivePassword(): string {
    return this.readPasswordOverride() ?? AUTH_CREDENTIALS.password;
  }

  private createPasswordResetToken(): string {
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return btoa(randomPart);
  }

  private storePasswordResetToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const stored: StoredPasswordResetToken = {
      token,
      expiresAt: Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS,
    };

    localStorage.setItem(
      PASSWORD_RESET_TOKEN_STORAGE_KEY,
      JSON.stringify(stored),
    );
  }

  private readPasswordResetToken(): StoredPasswordResetToken | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = localStorage.getItem(PASSWORD_RESET_TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredPasswordResetToken;
    } catch {
      localStorage.removeItem(PASSWORD_RESET_TOKEN_STORAGE_KEY);
      return null;
    }
  }

  private clearPasswordResetToken(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(PASSWORD_RESET_TOKEN_STORAGE_KEY);
  }

  private storePasswordOverride(password: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(PASSWORD_OVERRIDE_STORAGE_KEY, password);
  }

  private readPasswordOverride(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(PASSWORD_OVERRIDE_STORAGE_KEY);
  }
}
