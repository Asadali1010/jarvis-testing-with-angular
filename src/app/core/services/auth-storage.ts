import { InjectionToken } from '@angular/core';

export interface AuthUser {
  email: string;
  displayName?: string;
}

export interface AuthStorage {
  getToken(): string | null;
  setToken(token: string, user: AuthUser): void;
  getUser(): AuthUser | null;
  clear(): void;
}

export const AUTH_STORAGE = new InjectionToken<AuthStorage>('AUTH_STORAGE');
