import { Injectable, inject } from '@angular/core';

import {
  ProfileMutationResult,
  UpdateProfileInput,
  USER_FIELD_LIMITS,
  User,
} from '../models/user.model';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly activityService = inject(ActivityService);

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

  updateProfileForCurrentUser(input: UpdateProfileInput): ProfileMutationResult {
    const auth = this.authService.currentUser();
    if (!auth) {
      return { success: false, error: 'Sign in to update your profile.' };
    }

    const normalized = this.normalizeProfileInput(input);
    const validationError = this.validateProfileInput(normalized);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const profile = this.getProfileForCurrentUser();
    if (!profile) {
      return { success: false, error: 'Profile not found.' };
    }

    if (profile.id === 'auth-user') {
      const result = this.userService.createUser(
        {
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          email: auth.email,
          phone: normalized.phone,
          role: profile.role,
          department: profile.department,
          status: profile.status,
          address: normalized.address,
          bio: normalized.bio,
          company: normalized.company,
        },
        { skipActivity: true },
      );

      if (result.success) {
        this.activityService.recordProfileChange(
          `${result.user.firstName} ${result.user.lastName}`,
          result.user.id,
        );
      }

      return result;
    }

    const result = this.userService.updateUser(
      profile.id,
      {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        phone: normalized.phone,
        address: normalized.address,
        bio: normalized.bio,
        company: normalized.company,
      },
      { skipActivity: true },
    );

    if (result.success) {
      this.activityService.recordProfileChange(
        `${result.user.firstName} ${result.user.lastName}`,
        result.user.id,
      );
    }

    return result;
  }

  private normalizeProfileInput(input: UpdateProfileInput): UpdateProfileInput {
    return {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim(),
      address: input.address?.trim() || undefined,
      bio: input.bio?.trim() || undefined,
      company: input.company?.trim() || undefined,
    };
  }

  private validateProfileInput(input: UpdateProfileInput): string | null {
    if (!input.firstName) {
      return 'First name is required.';
    }

    if (input.firstName.length > USER_FIELD_LIMITS.firstName) {
      return `First name must be ${USER_FIELD_LIMITS.firstName} characters or fewer.`;
    }

    if (!input.lastName) {
      return 'Last name is required.';
    }

    if (input.lastName.length > USER_FIELD_LIMITS.lastName) {
      return `Last name must be ${USER_FIELD_LIMITS.lastName} characters or fewer.`;
    }

    if (!input.phone) {
      return 'Phone is required.';
    }

    if (!this.userService.isValidPhone(input.phone)) {
      return 'Enter a valid phone number.';
    }

    if (input.phone.length > USER_FIELD_LIMITS.phone) {
      return `Phone must be ${USER_FIELD_LIMITS.phone} characters or fewer.`;
    }

    if (input.address && input.address.length > USER_FIELD_LIMITS.address) {
      return `Address must be ${USER_FIELD_LIMITS.address} characters or fewer.`;
    }

    if (input.bio && input.bio.length > USER_FIELD_LIMITS.bio) {
      return `Bio must be ${USER_FIELD_LIMITS.bio} characters or fewer.`;
    }

    if (input.company && input.company.length > USER_FIELD_LIMITS.company) {
      return `Company must be ${USER_FIELD_LIMITS.company} characters or fewer.`;
    }

    return null;
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
