import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly submitted = signal(false);
  readonly authError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly resetToken = signal<string | null>(null);
  readonly isLoading = this.authService.isLoading;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
  });

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);
    this.successMessage.set(null);
    this.resetToken.set(null);

    const email = this.form.controls.email.value.trim();
    this.form.patchValue({ email }, { emitEvent: false });
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    const result = await this.authService.requestPasswordReset(email);

    if (result.success) {
      this.successMessage.set(result.message);
      this.resetToken.set(result.resetToken ?? null);
      return;
    }

    this.authError.set(result.error);
  }

  showError(controlName: 'email'): boolean {
    const control = this.form.controls[controlName];
    return (control.touched || this.submitted()) && control.invalid;
  }

  getErrorMessage(controlName: 'email'): string {
    const control = this.form.controls[controlName];

    if (control.hasError('required')) {
      return 'Email is required.';
    }

    if (control.hasError('pattern')) {
      return 'Enter a valid email address.';
    }

    return '';
  }
}
