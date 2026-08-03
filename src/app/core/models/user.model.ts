export type UserStatus = 'active' | 'inactive';

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  avatar?: string;
  address?: string;
  bio?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status?: UserStatus;
  avatar?: string;
  address?: string;
  bio?: string;
  company?: string;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface UserFilters {
  status?: UserStatus | 'all';
  role?: UserRole | 'all';
  department?: string | 'all';
}

export type UserSortField =
  | keyof Pick<
      User,
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phone'
      | 'role'
      | 'department'
      | 'status'
      | 'createdAt'
      | 'updatedAt'
    >
  | 'fullName';

export type SortDirection = 'asc' | 'desc';

export interface UserQueryParams {
  search?: string;
  filters?: UserFilters;
  sortField?: UserSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SystemStatus = 'operational' | 'degraded' | 'maintenance';

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newUsers: number;
  systemStatus: SystemStatus;
}

export type UserMutationResult =
  | { success: true; user: User }
  | { success: false; error: string };

export type BulkMutationResult =
  | { success: true; affected: number }
  | { success: false; error: string };

/** Maximum lengths for user profile and directory fields. */
export const USER_FIELD_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 254,
  phone: 20,
  department: 100,
  address: 200,
  bio: 500,
  company: 100,
} as const;

/** Fields a user may update on their own profile. */
export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  address?: string;
  bio?: string;
  company?: string;
}

export type ProfileMutationResult =
  | { success: true; user: User }
  | { success: false; error: string };
