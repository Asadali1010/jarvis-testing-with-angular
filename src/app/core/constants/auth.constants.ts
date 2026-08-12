export const AUTH_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin@123',
} as const;

export const AUTH_STORAGE_KEY = 'app.auth.token';

export const PASSWORD_RESET_TOKEN_STORAGE_KEY = 'app.auth.password-reset-token';

export const PASSWORD_OVERRIDE_STORAGE_KEY = 'app.auth.password-override';

export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account exists for that email, password reset instructions have been sent.';

export const PASSWORD_RESET_COMPLETE_MESSAGE =
  'Your password has been reset. Sign in with your new password.';

export const MIN_PASSWORD_LENGTH = 8;

export const THEME_STORAGE_KEY = 'app.theme';
