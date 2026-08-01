import { Injectable, inject } from '@angular/core';

import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  getProfileForCurrentUser(): User | null {
    const auth = this.authService.currentUser();
    if (!auth) {
      return null;
    }

    const matched = this.userService
      .users()
      .find((user) => user.email.toLowerCase() === auth.email.toLowerCase());

    if (matched) {
      return matched;
    }

    return this.buildFallbackProfile(auth.email);
  }

  private buildFallbackProfile(email: string): User {
    return {
      id: 'auth-user',
      firstName: 'Admin',
      lastName: 'User',
      email,
      phone: '+1 (555) 000-0000',
      role: 'admin',
      department: 'Administration',
      status: 'active',
      address: '123 Enterprise Way, Suite 100',
      bio: 'System administrator for Jarvis Enterprise.',
      company: 'Jarvis Corp',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
  }
}
