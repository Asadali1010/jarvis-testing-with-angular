import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  USER_FIELD_LIMITS,
  User,
} from '../../../../core/models/user.model';
import { ProfileService } from '../../../../core/services/profile.service';
import { UserService } from '../../../../core/services/user.service';
import { formatUserRole } from '../../../../core/utils/user-display.util';

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <form
      class="profile-form"
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      novalidate
      aria-labelledby="profile-heading"
    >
      <div class="profile-avatar-section">
        <div class="avatar-container">
          @if (previewUrl()) {
            <img [src]="previewUrl()" alt="Profile preview" class="avatar-preview" />
          } @else {
            <div class="avatar-placeholder">
              {{ user().firstName[0] }}{{ user().lastName[0] }}
            </div>
          }
        </div>
        
        <div class="avatar-actions">
          <label class="btn-secondary">
            Change Image
            <input
              type="file"
              class="sr-only"
              accept=".jpg,.jpeg,.png,.webp"
              (change)="onFileSelected($event)"
            />
          </label>
          @if (previewUrl()) {
            <button type="button" class="btn-text btn-danger" (click)="removeImage()">
              Remove Image
            </button>
          }
        </div>
        @if (avatarError()) {
          <span class="field-error" role="alert">{{ avatarError() }}</span>
        }
      </div>

      <div class="profile-readonly-grid">
        <div class="profile-readonly">
          <span class="profile-readonly-label">Email</span>
          <span class="profile-readonly-value">{{ user().email }}</span>
          <span class="profile-readonly-hint">
            Contact your administrator to change your email.
          </span>
        </div>
        <div class="profile-readonly">
          <span class="profile-readonly-label">Role</span>
          <span class="profile-readonly-value">{{ formatUserRole(user().role) }}</span>
        </div>
        <div class="profile-readonly">
          <span class="profile-readonly-label">Department</span>
          <span class="profile-readonly-value">{{ user().department }}</span>
        </div>
        <div class="profile-readonly">
          <span class="profile-readonly-label">Member since</span>
          <span class="profile-readonly-value">
            <time [attr.datetime]="user().createdAt">
              {{ user().createdAt | date: 'longDate' }}
            </time>
          </span>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label for="profile-firstName">First name</label>
          <input
            id="profile-firstName"
            type="text"
            formControlName="firstName"
            autocomplete="given-name"
            [attr.aria-invalid]="showError('firstName')"
            [attr.aria-describedby]="showError('firstName') ? 'profile-firstName-error' : null"
          />
          @if (showError('firstName')) {
            <span id="profile-firstName-error" class="field-error" role="alert">
              {{ getError('firstName') }}
            </span>
          }
        </div>

        <div class="form-field">
          <label for="profile-lastName">Last name</label>
          <input
            id="profile-lastName"
            type="text"
            formControlName="lastName"
            autocomplete="family-name"
            [attr.aria-invalid]="showError('lastName')"
            [attr.aria-describedby]="showError('lastName') ? 'profile-lastName-error' : null"
          />
          @if (showError('lastName')) {
            <span id="profile-lastName-error" class="field-error" role="alert">
              {{ getError('lastName') }}
            </span>
          }
        </div>

        <div class="form-field">
          <label for="profile-phone">Phone</label>
          <input
            id="profile-phone"
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            [attr.aria-invalid]="showError('phone')"
            [attr.aria-describedby]="showError('phone') ? 'profile-phone-error' : null"
          />
          @if (showError('phone')) {
            <span id="profile-phone-error" class="field-error" role="alert">
              {{ getError('phone') }}
            </span>
          }
        </div>

        <div class="form-field">
          <label for="profile-company">
            Company <span class="optional">(optional)</span>
          </label>
          <input
            id="profile-company"
            type="text"
            formControlName="company"
            [attr.aria-invalid]="showError('company')"
            [attr.aria-describedby]="showError('company') ? 'profile-company-error' : null"
          />
          @if (showError('company')) {
            <span id="profile-company-error" class="field-error" role="alert">
              {{ getError('company') }}
            </span>
          }
        </div>

        <div class="form-field form-field-full">
          <label for="profile-address">
            Address <span class="optional">(optional)</span>
          </label>
          <input
            id="profile-address"
            type="text"
            formControlName="address"
            [attr.aria-invalid]="showError('address')"
            [attr.aria-describedby]="showError('address') ? 'profile-address-error' : null"
          />
          @if (showError('address')) {
            <span id="profile-address-error" class="field-error" role="alert">
              {{ getError('address') }}
            </span>
          }
        </div>

        <div class="form-field form-field-full">
          <label for="profile-bio">Bio <span class="optional">(optional)</span></label>
          <textarea
            id="profile-bio"
            rows="3"
            formControlName="bio"
            [attr.aria-invalid]="showError('bio')"
            [attr.aria-describedby]="showError('bio') ? 'profile-bio-error' : null"
          ></textarea>
          @if (showError('bio')) {
            <span id="profile-bio-error" class="field-error" role="alert">
              {{ getError('bio') }}
            </span>
          }
        </div>
      </div>

      @if (serverError()) {
        <p class="form-error" role="alert">{{ serverError() }}</p>
      }

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="isSaving()"
          (click)="cancelled.emit()"
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
          {{ isSaving() ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .profile-readonly-grid {
        display: grid;
        gap: var(--space-4);
      }

      @media (min-width: 640px) {
        .profile-readonly-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .profile-readonly {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-bg-muted) 70%, transparent);
        border: 1px solid var(--color-border);
      }

      .profile-readonly-label {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .profile-readonly-value {
        font-size: var(--text-sm);
        color: var(--color-text);
      }

      .profile-readonly-hint {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .form-grid {
        display: grid;
        gap: var(--space-4);
      }

      @media (min-width: 640px) {
        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .form-field-full {
        grid-column: 1 / -1;
      }

      .form-field label {
        display: block;
        margin-bottom: var(--space-2);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text);
      }

      .optional {
        font-weight: 400;
        color: var(--color-text-muted);
      }

      .form-field input,
      .form-field textarea {
        width: 100%;
        min-height: 2.75rem;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: var(--text-sm);
        font-family: inherit;
        transition: var(--transition-interactive);
      }

      .form-field textarea {
        resize: vertical;
        min-height: 5rem;
      }

      .form-field input:focus-visible,
      .form-field textarea:focus-visible {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus-ring) 45%, transparent);
      }

      .form-field input[aria-invalid='true'],
      .form-field textarea[aria-invalid='true'] {
        border-color: var(--color-danger);
      }

      .field-error,
      .form-error {
        margin: var(--space-2) 0 0;
        font-size: var(--text-xs);
        color: var(--color-danger);
      }

      .profile-avatar-section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
        padding-bottom: var(--space-5);
        border-bottom: 1px solid var(--color-border);
      }

      .avatar-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 5rem;
        height: 5rem;
        border-radius: var(--radius-lg);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-muted)),
          var(--color-bg-muted)
        );
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .avatar-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--color-primary);
      }

      .avatar-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-3);
      }

      .avatar-actions .btn-secondary {
        display: inline-flex;
        align-items: center;
        min-height: 2.75rem;
        padding: var(--space-2) var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-muted);
        color: var(--color-text);
        font-size: var(--text-sm);
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition-interactive);
      }

      .avatar-actions .btn-secondary:hover {
        background: var(--color-bg);
        border-color: var(--color-primary);
      }

      .btn-text {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        font-size: var(--text-sm);
        font-weight: 600;
        cursor: pointer;
      }

      .btn-danger {
        color: var(--color-danger);
      }

      .btn-danger:hover {
        text-decoration: underline;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        padding-top: var(--space-2);
      }
    `,
  ],
})
export class ProfileFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly userService = inject(UserService);

  readonly user = input.required<User>();

  readonly saved = output<User>();
  readonly cancelled = output<void>();

  readonly serverError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);

  readonly formatUserRole = formatUserRole;

  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.maxLength(USER_FIELD_LIMITS.address)],
    bio: ['', Validators.maxLength(USER_FIELD_LIMITS.bio)],
    company: ['', Validators.maxLength(USER_FIELD_LIMITS.company)],
  });

  patchFromUser(user: User): void {
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address ?? '',
      bio: user.bio ?? '',
      company: user.company ?? '',
    });
    this.previewUrl.set(user.avatar || null);
    this.submitted = false;
    this.serverError.set(null);
  }

  onFileSelected(event: Event): void {
    this.avatarError.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.avatarError.set('Unsupported file format. Please use JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.avatarError.set('Image size must be 2MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.previewUrl.set(null);
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSaving.set(true);

    const value = this.form.getRawValue();
    const phone = value.phone.trim();

    if (!this.userService.isValidPhone(phone)) {
      this.form.controls.phone.setErrors({ phone: true });
      this.isSaving.set(false);
      return;
    }

    const result = this.profileService.updateProfileForCurrentUser({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phone,
      address: value.address.trim() || undefined,
      bio: value.bio.trim() || undefined,
      company: value.company.trim() || undefined,
      avatar: this.previewUrl() ?? undefined,
    });

    if (result.success) {
      this.isSaving.set(false);
      this.saved.emit(result.user);
      return;
    }

    this.isSaving.set(false);
    this.serverError.set(result.error);
  }

  showError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return (control.touched || this.submitted) && control.invalid;
  }

  getError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];

    if (control.hasError('required')) {
      return `${this.fieldLabel(field)} is required.`;
    }

    if (field === 'phone' && control.hasError('phone')) {
      return 'Enter a valid phone number.';
    }

    if (control.hasError('maxlength')) {
      const max = control.getError('maxlength')?.requiredLength;
      return `${this.fieldLabel(field)} must be ${max} characters or fewer.`;
    }

    return '';
  }

  private fieldLabel(field: keyof typeof this.form.controls): string {
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone',
      address: 'Address',
      bio: 'Bio',
      company: 'Company',
    };
    return labels[field] ?? field;
  }
}
