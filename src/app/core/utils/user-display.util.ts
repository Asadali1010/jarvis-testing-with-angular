import { SystemStatus, User, UserRole } from '../models/user.model';

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'User',
  viewer: 'Viewer',
};

export function formatUserRole(role?: UserRole): string {
  if (!role) {
    return '—';
  }
  return USER_ROLE_LABELS[role];
}

export function getUserInitials(
  user: Pick<User, 'firstName' | 'lastName'> | null | undefined,
  fallback = '',
): string {
  if (!user) {
    return fallback;
  }
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function formatSystemStatus(status: SystemStatus): string {
  switch (status) {
    case 'operational':
      return 'All systems operational';
    case 'degraded':
      return 'Performance degraded';
    case 'maintenance':
      return 'Maintenance mode';
  }
}

export function systemStatusLabel(status: SystemStatus): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'degraded':
      return 'Degraded';
    case 'maintenance':
      return 'Maintenance';
  }
}
