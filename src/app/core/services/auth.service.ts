import { Injectable, computed, inject, signal } from '@angular/core';

import { AUTH_CREDENTIALS } from '../constants/auth.constants';
import { ActivityService } from './activity.service';
import { AUTH_STORAGE, AuthUser } from './auth-storage';

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

export type SignupResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
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
        trimmedPassword !== AUTH_CREDENTIALS.password
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

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private createMockToken(user: AuthUser): string {
    return btoa(JSON.stringify({ sub: user.email, iat: Date.now() }));
  }

  private simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
}
