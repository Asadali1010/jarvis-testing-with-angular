import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly currentUser = this.authService.currentUser;

  readonly profile = computed(() => this.profileService.getProfileForCurrentUser());

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

}
