import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  BulkMutationResult,
  CreateUserInput,
  PaginatedUsers,
  SortDirection,
  SystemStatus,
  UpdateUserInput,
  User,
  UserFilters,
  UserMutationResult,
  UserQueryParams,
  UserSortField,
  UserStats,
} from '../models/user.model';
import { ActivityService } from './activity.service';

const USERS_STORAGE_KEY = 'app.users';
const NEW_USER_WINDOW_DAYS = 30;

const SEED_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    role: 'admin',
    department: 'Engineering',
    status: 'active',
    company: 'Jarvis Corp',
    bio: 'Platform administrator.',
    createdAt: '2025-11-10T09:00:00.000Z',
    updatedAt: '2026-07-01T14:30:00.000Z',
  },
  {
    id: 'user-2',
    firstName: 'Maria',
    lastName: 'Chen',
    email: 'maria.chen@example.com',
    phone: '+1 (555) 234-5678',
    role: 'manager',
    department: 'Operations',
    status: 'active',
    company: 'Jarvis Corp',
    createdAt: '2026-01-15T11:20:00.000Z',
    updatedAt: '2026-06-20T08:45:00.000Z',
  },
  {
    id: 'user-3',
    firstName: 'David',
    lastName: 'Patel',
    email: 'david.patel@example.com',
    phone: '+1 (555) 345-6789',
    role: 'user',
    department: 'Sales',
    status: 'inactive',
    company: 'Jarvis Corp',
    createdAt: '2026-03-05T16:10:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'user-4',
    firstName: 'Emily',
    lastName: 'Nguyen',
    email: 'emily.nguyen@example.com',
    phone: '+1 (555) 456-7890',
    role: 'viewer',
    department: 'Marketing',
    status: 'active',
    company: 'Jarvis Corp',
    createdAt: '2026-07-10T13:00:00.000Z',
    updatedAt: '2026-07-25T09:15:00.000Z',
  },
  {
    id: 'user-5',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 567-8901',
    role: 'user',
    department: 'Support',
    status: 'active',
    company: 'Jarvis Corp',
    createdAt: '2026-07-20T10:30:00.000Z',
    updatedAt: '2026-07-28T17:00:00.000Z',
  },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly activityService = inject(ActivityService);

  private readonly usersState = signal<User[]>(this.loadUsers());
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly users = computed(() => this.usersState());

  readonly stats = computed<UserStats>(() => {
    const allUsers = this.usersState();
    const now = Date.now();
    const newUserCutoff =
      now - NEW_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const active = allUsers.filter((user) => user.status === 'active').length;
    const inactive = allUsers.length - active;
    const newUsers = allUsers.filter(
      (user) => new Date(user.createdAt).getTime() >= newUserCutoff,
    ).length;

    return {
      total: allUsers.length,
      active,
      inactive,
      newUsers,
      systemStatus: this.resolveSystemStatus(active, inactive),
    };
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.persistUsers(this.usersState());
    }
  }

  getUserById(id: string): User | undefined {
    return this.usersState().find((user) => user.id === id);
  }

  createUser(input: CreateUserInput): UserMutationResult {
    const validationError = this.validateUserInput(input);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    if (this.isDuplicateEmail(input.email)) {
      const message = 'A user with this email already exists.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const now = new Date().toISOString();
    const user: User = {
      id: this.createId(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: input.role,
      department: input.department.trim(),
      status: input.status ?? 'active',
      avatar: input.avatar,
      address: input.address?.trim(),
      bio: input.bio?.trim(),
      company: input.company?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.usersState.update((current) => [...current, user]);
    this.persistUsers(this.usersState());
    this.error.set(null);

    const fullName = `${user.firstName} ${user.lastName}`;
    this.activityService.recordUserCreate(fullName, user.id);

    return { success: true, user };
  }

  updateUser(id: string, input: UpdateUserInput): UserMutationResult {
    const existing = this.getUserById(id);
    if (!existing) {
      const message = 'User not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const merged: CreateUserInput = {
      firstName: input.firstName ?? existing.firstName,
      lastName: input.lastName ?? existing.lastName,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      role: input.role ?? existing.role,
      department: input.department ?? existing.department,
      status: input.status ?? existing.status,
      avatar: input.avatar ?? existing.avatar,
      address: input.address ?? existing.address,
      bio: input.bio ?? existing.bio,
      company: input.company ?? existing.company,
    };

    const validationError = this.validateUserInput(merged);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    const normalizedEmail = merged.email.trim().toLowerCase();
    if (
      normalizedEmail !== existing.email.toLowerCase() &&
      this.isDuplicateEmail(normalizedEmail, id)
    ) {
      const message = 'A user with this email already exists.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const updated: User = {
      ...existing,
      ...merged,
      firstName: merged.firstName.trim(),
      lastName: merged.lastName.trim(),
      email: normalizedEmail,
      phone: merged.phone.trim(),
      department: merged.department.trim(),
      address: merged.address?.trim(),
      bio: merged.bio?.trim(),
      company: merged.company?.trim(),
      updatedAt: new Date().toISOString(),
    };

    this.usersState.update((current) =>
      current.map((user) => (user.id === id ? updated : user)),
    );
    this.persistUsers(this.usersState());
    this.error.set(null);

    const fullName = `${updated.firstName} ${updated.lastName}`;
    this.activityService.recordUserUpdate(fullName, updated.id);

    return { success: true, user: updated };
  }

  deleteUser(id: string): BulkMutationResult {
    const existing = this.getUserById(id);
    if (!existing) {
      const message = 'User not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    this.usersState.update((current) =>
      current.filter((user) => user.id !== id),
    );
    this.persistUsers(this.usersState());
    this.error.set(null);

    return { success: true, affected: 1 };
  }

  bulkDelete(ids: string[]): BulkMutationResult {
    if (ids.length === 0) {
      return { success: false, error: 'No users selected.' };
    }

    const idSet = new Set(ids);
    const affected = this.usersState().filter((user) => idSet.has(user.id)).length;

    if (affected === 0) {
      return { success: false, error: 'No matching users found.' };
    }

    this.usersState.update((current) =>
      current.filter((user) => !idSet.has(user.id)),
    );
    this.persistUsers(this.usersState());
    this.error.set(null);

    return { success: true, affected };
  }

  bulkActivate(ids: string[]): BulkMutationResult {
    return this.bulkUpdateStatus(ids, 'active');
  }

  bulkDeactivate(ids: string[]): BulkMutationResult {
    return this.bulkUpdateStatus(ids, 'inactive');
  }

  searchUsers(query: string, source: User[] = this.usersState()): User[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [...source];
    }

    return source.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.phone.toLowerCase().includes(normalized) ||
        user.role.toLowerCase().includes(normalized)
      );
    });
  }

  filterUsers(filters: UserFilters, source: User[] = this.usersState()): User[] {
    return source.filter((user) => {
      if (filters.status && filters.status !== 'all' && user.status !== filters.status) {
        return false;
      }

      if (filters.role && filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }

      if (
        filters.department &&
        filters.department !== 'all' &&
        user.department !== filters.department
      ) {
        return false;
      }

      return true;
    });
  }

  sortUsers(
    field: UserSortField,
    direction: SortDirection = 'asc',
    source: User[] = this.usersState(),
  ): User[] {
    const sorted = [...source].sort((left, right) => {
      const leftValue = this.getSortValue(left, field);
      const rightValue = this.getSortValue(right, field);

      if (leftValue < rightValue) {
        return direction === 'asc' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return direction === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }

  queryUsers(params: UserQueryParams = {}): PaginatedUsers {
    const pageSize = params.pageSize ?? 10;
    const page = params.page ?? 1;
    const sortField = params.sortField ?? 'createdAt';
    const sortDirection = params.sortDirection ?? 'desc';

    let result = this.searchUsers(params.search ?? '');
    result = this.filterUsers(params.filters ?? {}, result);
    result = this.sortUsers(sortField, sortDirection, result);

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      items: result.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  private bulkUpdateStatus(
    ids: string[],
    status: User['status'],
  ): BulkMutationResult {
    if (ids.length === 0) {
      return { success: false, error: 'No users selected.' };
    }

    const idSet = new Set(ids);
    let affected = 0;
    const now = new Date().toISOString();

    this.usersState.update((current) =>
      current.map((user) => {
        if (!idSet.has(user.id) || user.status === status) {
          return user;
        }

        affected += 1;
        return { ...user, status, updatedAt: now };
      }),
    );

    if (affected === 0) {
      return { success: false, error: 'No matching users found.' };
    }

    this.persistUsers(this.usersState());
    this.error.set(null);

    return { success: true, affected };
  }

  private validateUserInput(input: CreateUserInput): string | null {
    if (!input.firstName?.trim()) {
      return 'First name is required.';
    }

    if (!input.lastName?.trim()) {
      return 'Last name is required.';
    }

    if (!input.email?.trim()) {
      return 'Email is required.';
    }

    if (!this.isValidEmail(input.email)) {
      return 'Enter a valid email address.';
    }

    if (!input.phone?.trim()) {
      return 'Phone is required.';
    }

    if (!this.isValidPhone(input.phone)) {
      return 'Enter a valid phone number.';
    }

    if (!input.role) {
      return 'Role is required.';
    }

    if (!input.department?.trim()) {
      return 'Department is required.';
    }

    return null;
  }

  private isDuplicateEmail(email: string, excludeId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.usersState().some(
      (user) =>
        user.email.toLowerCase() === normalized && user.id !== excludeId,
    );
  }

  private getSortValue(user: User, field: UserSortField): string {
    if (field === 'fullName') {
      return `${user.lastName} ${user.firstName}`.toLowerCase();
    }

    return String(user[field]).toLowerCase();
  }

  private resolveSystemStatus(active: number, inactive: number): SystemStatus {
    const total = active + inactive;
    if (total === 0) {
      return 'maintenance';
    }

    const inactiveRatio = inactive / total;
    if (inactiveRatio >= 0.5) {
      return 'degraded';
    }

    return 'operational';
  }

  private loadUsers(): User[] {
    if (!isPlatformBrowser(this.platformId)) {
      return structuredClone(SEED_USERS);
    }

    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      return structuredClone(SEED_USERS);
    }

    try {
      const parsed = JSON.parse(stored) as User[];
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : structuredClone(SEED_USERS);
    } catch {
      return structuredClone(SEED_USERS);
    }
  }

  private persistUsers(users: User[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  private createId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
