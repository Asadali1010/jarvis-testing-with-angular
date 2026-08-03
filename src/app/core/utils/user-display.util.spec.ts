import { UserRole } from '../models/user.model';
import {
  USER_ROLE_OPTIONS,
  formatSystemStatus,
  formatUserRole,
  getUserInitials,
  systemStatusLabel,
} from './user-display.util';

describe('user-display.util', () => {
  describe('USER_ROLE_OPTIONS', () => {
    it('lists every role with a display label', () => {
      const roles: UserRole[] = ['admin', 'manager', 'user', 'viewer'];
      expect(USER_ROLE_OPTIONS.map((option) => option.value)).toEqual(roles);
      expect(USER_ROLE_OPTIONS.every((option) => option.label.length > 0)).toBe(
        true,
      );
    });
  });

  describe('formatUserRole', () => {
    it('returns a label for each role', () => {
      expect(formatUserRole('admin')).toBe('Administrator');
      expect(formatUserRole('manager')).toBe('Manager');
      expect(formatUserRole('user')).toBe('User');
      expect(formatUserRole('viewer')).toBe('Viewer');
    });

    it('returns an em dash when role is missing', () => {
      expect(formatUserRole(undefined)).toBe('—');
    });
  });

  describe('getUserInitials', () => {
    it('returns uppercase initials from first and last name', () => {
      expect(
        getUserInitials({ firstName: 'Jane', lastName: 'Doe' }),
      ).toBe('JD');
    });

    it('returns the fallback when user is missing', () => {
      expect(getUserInitials(null)).toBe('');
      expect(getUserInitials(undefined, 'U')).toBe('U');
    });
  });

  describe('formatSystemStatus', () => {
    it('returns a description for each status', () => {
      expect(formatSystemStatus('operational')).toBe('All systems operational');
      expect(formatSystemStatus('degraded')).toBe('Performance degraded');
      expect(formatSystemStatus('maintenance')).toBe('Maintenance mode');
    });
  });

  describe('systemStatusLabel', () => {
    it('returns a short label for each status', () => {
      expect(systemStatusLabel('operational')).toBe('Operational');
      expect(systemStatusLabel('degraded')).toBe('Degraded');
      expect(systemStatusLabel('maintenance')).toBe('Maintenance');
    });
  });
});
