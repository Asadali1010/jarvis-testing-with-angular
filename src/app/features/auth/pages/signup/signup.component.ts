import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

type SignupControlName =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly authError = signal<string | null>(null);
  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      password: [
        '',
        [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);

    const fullName = this.form.controls.fullName.value.trim();
    const email = this.form.controls.email.value.trim();
    const password = this.form.controls.password.value.trim();
    const confirmPassword = this.form.controls.confirmPassword.value.trim();
    this.form.patchValue(
      { fullName, email, password, confirmPassword },
      { emitEvent: false },
    );
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    const result = await this.authService.signup(fullName, email, password);

    if (result.success) {
      await this.router.navigate(['/dashboard']);
      return;
    }

    this.authError.set(result.error);
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update((visible) => !visible);
      return;
    }

    this.showConfirmPassword.update((visible) => !visible);
  }

  showError(controlName: SignupControlName): boolean {
    if (controlName === 'confirmPassword' && this.hasPasswordMismatch()) {
      return (
        this.form.controls.confirmPassword.touched || this.submitted()
      );
    }

    const control = this.form.controls[controlName];
    return (control.touched || this.submitted()) && control.invalid;
  }

  getErrorMessage(controlName: SignupControlName): string {
    const control = this.form.controls[controlName];

    if (controlName === 'confirmPassword' && this.hasPasswordMismatch()) {
      return 'Passwords do not match.';
    }

    if (control.hasError('required')) {
      switch (controlName) {
        case 'fullName':
          return 'Full name is required.';
        case 'email':
          return 'Email is required.';
        case 'password':
          return 'Password is required.';
        case 'confirmPassword':
          return 'Please confirm your password.';
      }
    }

    if (controlName === 'email' && control.hasError('pattern')) {
      return 'Enter a valid email address.';
    }

    if (controlName === 'password' && control.hasError('minlength')) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return '';
  }

  private hasPasswordMismatch(): boolean {
    return (
      this.form.hasError('passwordMismatch') &&
      this.form.controls.confirmPassword.value.length > 0
    );
  }
}
