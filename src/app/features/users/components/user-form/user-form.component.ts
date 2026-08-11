import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CreateUserInput,
  User,
  UserRole,
  UserStatus,
} from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { USER_ROLE_OPTIONS } from '../../../../core/utils/user-display.util';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="user-form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <div class="form-grid">
        <div class="form-field">
          <label for="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            formControlName="firstName"
            autocomplete="given-name"
            [attr.aria-invalid]="showError('firstName')"
          />
          @if (showError('firstName')) {
            <span class="field-error" role="alert">{{ getError('firstName') }}</span>
          }
        </div>

        <div class="form-field">
          <label for="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            formControlName="lastName"
            autocomplete="family-name"
            [attr.aria-invalid]="showError('lastName')"
          />
          @if (showError('lastName')) {
            <span class="field-error" role="alert">{{ getError('lastName') }}</span>
          }
        </div>

        <div class="form-field form-field-full">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            [attr.aria-invalid]="showError('email')"
          />
          @if (showError('email')) {
            <span class="field-error" role="alert">{{ getError('email') }}</span>
          }
        </div>

        <div class="form-field">
          <label for="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            [attr.aria-invalid]="showError('phone')"
          />
          @if (showError('phone')) {
            <span class="field-error" role="alert">{{ getError('phone') }}</span>
          }
        </div>

        <div class="form-field">
          <label for="role">Role</label>
          <select id="role" formControlName="role" [attr.aria-invalid]="showError('role')">
            @for (role of roles; track role.value) {
              <option [value]="role.value">{{ role.label }}</option>
            }
          </select>
          @if (showError('role')) {
            <span class="field-error" role="alert">{{ getError('role') }}</span>
          }
        </div>

        <div class="form-field">
          <label for="department">Department</label>
          <input
            id="department"
            type="text"
            formControlName="department"
            [attr.aria-invalid]="showError('department')"
          />
          @if (showError('department')) {
            <span class="field-error" role="alert">{{ getError('department') }}</span>
          }
        </div>

        <div class="form-field">
          <label for="status">Status</label>
          <select id="status" formControlName="status">
            @for (status of statuses; track status.value) {
              <option [value]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>

        <div class="form-field form-field-full">
          <label for="company">Company <span class="optional">(optional)</span></label>
          <input id="company" type="text" formControlName="company" />
        </div>
      </div>

      @if (serverError()) {
        <p class="form-error" role="alert">{{ serverError() }}</p>
      }

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          {{ mode() === 'edit' ? 'Save changes' : 'Add user' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .user-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
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
      .form-field select {
        width: 100%;
        min-height: 2.75rem;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: var(--text-sm);
        transition: var(--transition-interactive);
      }

      .form-field input:focus-visible,
      .form-field select:focus-visible {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus-ring) 45%, transparent);
      }

      .field-error,
      .form-error {
        margin: var(--space-2) 0 0;
        font-size: var(--text-xs);
        color: var(--color-danger);
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
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly user = input<User | null>(null);
  readonly mode = input<'add' | 'edit'>('add');

  readonly saved = output<User>();
  readonly cancelled = output<void>();

  readonly serverError = signal<string | null>(null);

  readonly roles = USER_ROLE_OPTIONS;

  readonly statuses: { value: UserStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    phone: ['', Validators.required],
    role: ['user' as UserRole, Validators.required],
    department: ['', Validators.required],
    status: ['active' as UserStatus],
    company: [''],
  });

  constructor() {
    effect(() => {
      const existing = this.user();
      if (existing && this.mode() === 'edit') {
        this.form.patchValue({
          firstName: existing.firstName,
          lastName: existing.lastName,
          email: existing.email,
          phone: existing.phone,
          role: existing.role,
          department: existing.department,
          status: existing.status,
          company: existing.company ?? '',
        });
      } else if (this.mode() === 'add') {
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'user',
          department: '',
          status: 'active',
          company: '',
        });
      }
      this.submitted = false;
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const input: CreateUserInput = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      role: value.role,
      department: value.department.trim(),
      status: value.status,
      company: value.company.trim() || undefined,
    };

    if (!this.userService.isValidPhone(input.phone)) {
      this.form.controls.phone.setErrors({ phone: true });
      return;
    }

    const existing = this.user();
    const result =
      this.mode() === 'edit' && existing
        ? this.userService.updateUser(existing.id, input)
        : this.userService.createUser(input);

    if (result.success) {
      this.saved.emit(result.user);
      return;
    }

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

    if (field === 'email' && control.hasError('pattern')) {
      return 'Enter a valid email address.';
    }

    if (field === 'phone' && control.hasError('phone')) {
      return 'Enter a valid phone number.';
    }

    return '';
  }

  private fieldLabel(field: keyof typeof this.form.controls): string {
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      department: 'Department',
    };
    return labels[field] ?? field;
  }
}
