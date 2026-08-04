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
  USER_FIELD_LIMITS,
  User,
  UserFilters,
  UserMutationResult,
  UserQueryParams,
  UserRole,
  UserSortField,
  UserStats,
  UserStatus,
} from '../models/user.model';
import { ActivityService } from './activity.service';

const USERS_STORAGE_KEY = 'app.users';
const NEW_USER_WINDOW_DAYS = 30;

const SEED_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+1 (555) 000-0000',
    role: 'admin',
    department: 'Administration',
    status: 'active',
    address: '123 Enterprise Way, Suite 100',
    bio: 'System administrator for Jarvis Enterprise.',
    company: 'Jarvis Corp',
    createdAt: '2025-01-01T00:00:00.000Z',
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
    address: '450 Operations Blvd, Floor 3',
    bio: 'Operations manager overseeing daily workflows and team coordination.',
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
    address: '88 Market Street, Unit 12',
    bio: 'Sales representative focused on enterprise accounts.',
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
    address: '210 Creative Lane',
    bio: 'Marketing analyst tracking campaign performance and audience insights.',
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
    address: '15 Help Desk Row',
    bio: 'Customer support specialist helping users resolve issues quickly.',
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

  createUser(
    input: CreateUserInput,
    options?: { skipActivity?: boolean },
  ): UserMutationResult {
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

    if (!options?.skipActivity) {
      const fullName = `${user.firstName} ${user.lastName}`;
      this.activityService.recordUserCreate(fullName, user.id);
    }

    return { success: true, user };
  }

  updateUser(
    id: string,
    input: UpdateUserInput,
    options?: { skipActivity?: boolean },
  ): UserMutationResult {
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
      avatar: 'avatar' in input ? input.avatar : existing.avatar,
      address: 'address' in input ? input.address : existing.address,
      bio: 'bio' in input ? input.bio : existing.bio,
      company: 'company' in input ? input.company : existing.company,
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

    if (!options?.skipActivity) {
      const fullName = `${updated.firstName} ${updated.lastName}`;
      this.activityService.recordUserUpdate(fullName, updated.id);
    }

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

    if (input.firstName.trim().length > USER_FIELD_LIMITS.firstName) {
      return `First name must be ${USER_FIELD_LIMITS.firstName} characters or fewer.`;
    }

    if (!input.lastName?.trim()) {
      return 'Last name is required.';
    }

    if (input.lastName.trim().length > USER_FIELD_LIMITS.lastName) {
      return `Last name must be ${USER_FIELD_LIMITS.lastName} characters or fewer.`;
    }

    if (!input.email?.trim()) {
      return 'Email is required.';
    }

    if (input.email.trim().length > USER_FIELD_LIMITS.email) {
      return `Email must be ${USER_FIELD_LIMITS.email} characters or fewer.`;
    }

    if (!this.isValidEmail(input.email)) {
      return 'Enter a valid email address.';
    }

    if (!input.phone?.trim()) {
      return 'Phone is required.';
    }

    if (input.phone.trim().length > USER_FIELD_LIMITS.phone) {
      return `Phone must be ${USER_FIELD_LIMITS.phone} characters or fewer.`;
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

    if (input.department.trim().length > USER_FIELD_LIMITS.department) {
      return `Department must be ${USER_FIELD_LIMITS.department} characters or fewer.`;
    }

    if (input.address && input.address.trim().length > USER_FIELD_LIMITS.address) {
      return `Address must be ${USER_FIELD_LIMITS.address} characters or fewer.`;
    }

    if (input.bio && input.bio.trim().length > USER_FIELD_LIMITS.bio) {
      return `Bio must be ${USER_FIELD_LIMITS.bio} characters or fewer.`;
    }

    if (input.company && input.company.trim().length > USER_FIELD_LIMITS.company) {
      return `Company must be ${USER_FIELD_LIMITS.company} characters or fewer.`;
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
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return structuredClone(SEED_USERS);
      }

      return this.normalizeStoredUsers(parsed);
    } catch {
      return structuredClone(SEED_USERS);
    }
  }

  private normalizeStoredUsers(raw: unknown[]): User[] {
    const seedById = new Map(SEED_USERS.map((user) => [user.id, user]));
    const seedByEmail = new Map(
      SEED_USERS.map((user) => [user.email.toLowerCase(), user]),
    );
    const normalized: User[] = [];

    for (const item of raw) {
      const user = this.normalizeUserRecord(item, seedById, seedByEmail);
      if (user) {
        normalized.push(user);
      }
    }

    for (const seed of SEED_USERS) {
      if (!normalized.some((user) => user.id === seed.id)) {
        normalized.push(structuredClone(seed));
      }
    }

    return normalized.map((user) => this.enrichUserFromSeed(user, seedById));
  }

  private normalizeUserRecord(
    raw: unknown,
    seedById: Map<string, User>,
    seedByEmail: Map<string, User>,
  ): User | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Partial<User>;
    const seed =
      (record.id ? seedById.get(record.id) : undefined) ??
      (typeof record.email === 'string'
        ? seedByEmail.get(record.email.toLowerCase())
        : undefined);

    const now = new Date().toISOString();
    const fallbackId = seed?.id ?? this.createId();

    const firstName = this.normalizeString(record.firstName, seed?.firstName ?? 'Unknown');
    const lastName = this.normalizeString(record.lastName, seed?.lastName ?? 'User');
    const email = this.normalizeString(
      record.email,
      seed?.email ?? `unknown-${fallbackId}@example.com`,
    ).toLowerCase();
    const phone = this.normalizeString(record.phone, seed?.phone ?? '+1 (555) 000-0000');
    const role = this.normalizeRole(record.role, seed?.role ?? 'user');
    const department = this.normalizeString(
      record.department,
      seed?.department ?? 'General',
    );
    const status = this.normalizeStatus(record.status, seed?.status ?? 'active');

    return {
      id: typeof record.id === 'string' && record.id.trim() ? record.id : fallbackId,
      firstName: this.truncate(firstName, USER_FIELD_LIMITS.firstName),
      lastName: this.truncate(lastName, USER_FIELD_LIMITS.lastName),
      email: this.truncate(email, USER_FIELD_LIMITS.email),
      phone: this.truncate(phone, USER_FIELD_LIMITS.phone),
      role,
      department: this.truncate(department, USER_FIELD_LIMITS.department),
      status,
      avatar: typeof record.avatar === 'string' ? record.avatar : seed?.avatar,
      address: this.normalizeOptionalString(record.address, seed?.address),
      bio: this.normalizeOptionalString(record.bio, seed?.bio),
      company: this.normalizeOptionalString(record.company, seed?.company),
      createdAt:
        typeof record.createdAt === 'string' && record.createdAt
          ? record.createdAt
          : (seed?.createdAt ?? now),
      updatedAt:
        typeof record.updatedAt === 'string' && record.updatedAt
          ? record.updatedAt
          : (seed?.updatedAt ?? now),
    };
  }

  private enrichUserFromSeed(user: User, seedById: Map<string, User>): User {
    const seed = seedById.get(user.id);
    if (!seed) {
      return user;
    }

    return {
      ...user,
      address: user.address ?? seed.address,
      bio: user.bio ?? seed.bio,
      company: user.company ?? seed.company,
    };
  }

  private normalizeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private normalizeOptionalString(
    value: unknown,
    fallback?: string,
  ): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return fallback?.trim() || undefined;
  }

  private normalizeRole(value: unknown, fallback: UserRole): UserRole {
    const roles: UserRole[] = ['admin', 'manager', 'user', 'viewer'];
    return roles.includes(value as UserRole) ? (value as UserRole) : fallback;
  }

  private normalizeStatus(value: unknown, fallback: UserStatus): UserStatus {
    return value === 'active' || value === 'inactive' ? value : fallback;
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
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
