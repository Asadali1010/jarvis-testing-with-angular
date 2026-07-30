import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CreateUserInput } from '../models/user.model';
import { ActivityService } from './activity.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let activityService: ActivityService;
  let storage: Record<string, string>;

  const validUser: CreateUserInput = {
    firstName: 'Taylor',
    lastName: 'Brooks',
    email: 'taylor.brooks@example.com',
    phone: '+1 (555) 678-9012',
    role: 'user',
    department: 'Engineering',
  };

  beforeEach(() => {
    storage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    });

    TestBed.configureTestingModule({
      providers: [
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(UserService);
    activityService = TestBed.inject(ActivityService);
    activityService.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes seeded users and computed stats', () => {
    const stats = service.stats();

    expect(service.users().length).toBeGreaterThan(0);
    expect(stats.total).toBe(service.users().length);
    expect(stats.active + stats.inactive).toBe(stats.total);
    expect(stats.systemStatus).toBe('operational');
  });

  it('creates a user and records activity', () => {
    const result = service.createUser(validUser);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe('taylor.brooks@example.com');
      expect(service.getUserById(result.user.id)).toEqual(result.user);
    }
    expect(activityService.activities()[0]?.type).toBe('user_create');
  });

  it('prevents duplicate emails', () => {
    service.createUser(validUser);
    const duplicate = service.createUser({
      ...validUser,
      firstName: 'Other',
      lastName: 'Person',
    });

    expect(duplicate).toEqual({
      success: false,
      error: 'A user with this email already exists.',
    });
  });

  it('validates required, email, and phone fields', () => {
    expect(service.createUser({ ...validUser, firstName: '  ' })).toEqual({
      success: false,
      error: 'First name is required.',
    });
    expect(service.createUser({ ...validUser, email: 'invalid' })).toEqual({
      success: false,
      error: 'Enter a valid email address.',
    });
    expect(service.createUser({ ...validUser, phone: '123' })).toEqual({
      success: false,
      error: 'Enter a valid phone number.',
    });
  });

  it('updates and deletes users', () => {
    const created = service.createUser(validUser);
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }

    const updated = service.updateUser(created.user.id, {
      department: 'Product',
      phone: '+1 (555) 999-0000',
    });

    expect(updated.success).toBe(true);
    if (updated.success) {
      expect(updated.user.department).toBe('Product');
      expect(updated.user.phone).toBe('+1 (555) 999-0000');
    }

    const deleted = service.deleteUser(created.user.id);
    expect(deleted).toEqual({ success: true, affected: 1 });
    expect(service.getUserById(created.user.id)).toBeUndefined();
  });

  it('searches users by name, email, phone, and role', () => {
    const matches = service.searchUsers('maria');
    expect(matches.some((user) => user.email === 'maria.chen@example.com')).toBe(
      true,
    );

    const roleMatches = service.searchUsers('admin');
    expect(roleMatches.every((user) => user.role === 'admin')).toBe(true);
  });

  it('filters users by status, role, and department', () => {
    const filtered = service.filterUsers({
      status: 'active',
      role: 'user',
      department: 'Support',
    });

    expect(filtered).toEqual([
      expect.objectContaining({
        email: 'james.wilson@example.com',
        status: 'active',
        role: 'user',
        department: 'Support',
      }),
    ]);
  });

  it('sorts users in ascending and descending order', () => {
    const ascending = service.sortUsers('lastName', 'asc');
    const descending = service.sortUsers('lastName', 'desc');

    expect(ascending[0]?.lastName <= ascending.at(-1)!.lastName).toBe(true);
    expect(descending[0]?.lastName >= descending.at(-1)!.lastName).toBe(true);
  });

  it('returns paginated query results with combined helpers', () => {
    const page = service.queryUsers({
      search: 'example.com',
      filters: { status: 'active' },
      sortField: 'email',
      sortDirection: 'asc',
      page: 1,
      pageSize: 2,
    });

    expect(page.items.length).toBeLessThanOrEqual(2);
    expect(page.total).toBeGreaterThan(0);
    expect(page.page).toBe(1);
    expect(page.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('supports bulk activate, deactivate, and delete', () => {
    const first = service.createUser(validUser);
    const second = service.createUser({
      ...validUser,
      email: 'second.user@example.com',
      firstName: 'Second',
    });

    expect(first.success && second.success).toBe(true);
    if (!first.success || !second.success) {
      return;
    }

    const ids = [first.user.id, second.user.id];

    expect(service.bulkDeactivate(ids)).toEqual({ success: true, affected: 2 });
    expect(service.getUserById(first.user.id)?.status).toBe('inactive');

    expect(service.bulkActivate(ids)).toEqual({ success: true, affected: 2 });
    expect(service.getUserById(first.user.id)?.status).toBe('active');

    expect(service.bulkDelete(ids)).toEqual({ success: true, affected: 2 });
    expect(service.getUserById(first.user.id)).toBeUndefined();
  });

  it('reports errors for empty bulk selections', () => {
    expect(service.bulkDelete([])).toEqual({
      success: false,
      error: 'No users selected.',
    });
  });

  it('exposes email and phone validation helpers', () => {
    expect(service.isValidEmail('user@example.com')).toBe(true);
    expect(service.isValidEmail('bad-email')).toBe(false);
    expect(service.isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(service.isValidPhone('123')).toBe(false);
  });
});
