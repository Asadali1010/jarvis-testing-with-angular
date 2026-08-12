import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MIN_PASSWORD_LENGTH } from '../../../../core/constants/auth.constants';
import { AuthService } from '../../../../core/services/auth.service';

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

type ResetPasswordControlName = 'password' | 'confirmPassword';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitted = signal(false);
  readonly authError = signal<string | null>(null);
  readonly tokenMissing = signal(false);
  readonly resetToken = signal<string | null>(null);
  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: [
        '',
        [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();

    if (!token) {
      this.tokenMissing.set(true);
      return;
    }

    this.resetToken.set(token);
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);

    const password = this.form.controls.password.value.trim();
    const confirmPassword = this.form.controls.confirmPassword.value.trim();
    this.form.patchValue({ password, confirmPassword }, { emitEvent: false });
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    const token = this.resetToken();
    if (!token) {
      this.tokenMissing.set(true);
      return;
    }

    const result = await this.authService.resetPassword(
      token,
      password,
      confirmPassword,
    );

    if (result.success) {
      await this.router.navigate(['/login'], {
        queryParams: { reset: 'success' },
      });
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

  showError(controlName: ResetPasswordControlName): boolean {
    if (controlName === 'confirmPassword' && this.hasPasswordMismatch()) {
      return (
        this.form.controls.confirmPassword.touched || this.submitted()
      );
    }

    const control = this.form.controls[controlName];
    return (control.touched || this.submitted()) && control.invalid;
  }

  getErrorMessage(controlName: ResetPasswordControlName): string {
    const control = this.form.controls[controlName];

    if (controlName === 'confirmPassword' && this.hasPasswordMismatch()) {
      return 'Passwords do not match.';
    }

    if (control.hasError('required')) {
      return controlName === 'password'
        ? 'Password is required.'
        : 'Please confirm your password.';
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
