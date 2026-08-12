import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly authError = signal<string | null>(null);
  readonly isLoading = this.authService.isLoading;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    password: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);

    const email = this.form.controls.email.value.trim();
    const password = this.form.controls.password.value.trim();
    this.form.patchValue({ email, password }, { emitEvent: false });
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    const result = await this.authService.login(email, password);

    if (result.success) {
      await this.router.navigate(['/dashboard']);
      return;
    }

    this.authError.set(result.error);
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return (control.touched || this.submitted()) && control.invalid;
  }

  getErrorMessage(controlName: 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (control.hasError('required')) {
      return controlName === 'email'
        ? 'Email is required.'
        : 'Password is required.';
    }

    if (controlName === 'email' && control.hasError('pattern')) {
      return 'Enter a valid email address.';
    }

    return '';
  }
}
