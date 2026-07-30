import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { AUTH_STORAGE_KEY } from '../constants/auth.constants';
import { AuthStorage, AuthUser } from './auth-storage';

interface StoredAuthState {
  token: string;
  user: AuthUser;
}

@Injectable()
export class LocalStorageAuthStorage implements AuthStorage {
  private readonly platformId = inject(PLATFORM_ID);

  getToken(): string | null {
    return this.readState()?.token ?? null;
  }

  getUser(): AuthUser | null {
    return this.readState()?.user ?? null;
  }

  setToken(token: string, user: AuthUser): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const state: StoredAuthState = { token, user };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  private readState(): StoredAuthState | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredAuthState;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }
}
