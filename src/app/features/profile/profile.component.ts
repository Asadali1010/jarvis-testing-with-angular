import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';

import { User } from '../../core/models/user.model';
import {
  formatUserRole,
  getUserInitials,
} from '../../core/utils/user-display.util';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, ProfileFormComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  private readonly profileForm = viewChild(ProfileFormComponent);

  readonly currentUser = this.authService.currentUser;

  readonly profile = computed(() => this.profileService.getProfileForCurrentUser());

  readonly mode = signal<'view' | 'edit'>('view');
  readonly saveMessage = signal<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  readonly displayName = computed(() => {
    const user = this.profile();
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  });

  readonly avatarInitials = computed(() =>
    getUserInitials(this.profile(), 'U'),
  );

  readonly roleLabel = computed(() => formatUserRole(this.profile()?.role));

  enterEditMode(): void {
    const user = this.profile();
    if (!user) {
      return;
    }

    this.saveMessage.set(null);
    this.mode.set('edit');

    queueMicrotask(() => {
      this.profileForm()?.patchFromUser(user);
    });
  }

  cancelEdit(): void {
    this.mode.set('view');
    this.saveMessage.set(null);
  }

  onProfileSaved(_user: User): void {
    this.saveMessage.set({
      type: 'success',
      text: 'Profile updated successfully.',
    });
    this.mode.set('view');
  }

}
