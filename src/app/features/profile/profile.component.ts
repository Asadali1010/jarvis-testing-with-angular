import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { User, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly currentUser = this.authService.currentUser;

  readonly profile = computed(() => this.resolveProfile());

  readonly displayName = computed(() => {
    const user = this.profile();
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  });

  readonly avatarInitials = computed(() => {
    const user = this.profile();
    if (!user) {
      return 'U';
    }
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  readonly roleLabel = computed(() => this.formatRole(this.profile()?.role));

  formatRole(role?: UserRole): string {
    if (!role) {
      return '—';
    }

    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'user':
        return 'User';
      case 'viewer':
        return 'Viewer';
    }
  }

  private resolveProfile(): User | null {
    const auth = this.currentUser();
    if (!auth) {
      return null;
    }

    const matched = this.userService
      .users()
      .find((user) => user.email.toLowerCase() === auth.email.toLowerCase());

    if (matched) {
      return matched;
    }

    return {
      id: 'auth-user',
      firstName: 'Admin',
      lastName: 'User',
      email: auth.email,
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
