import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FocusTrapDirective } from '../../core/directives/focus-trap.directive';

import {
  SortDirection,
  User,
  UserFilters,
  UserRole,
  UserSortField,
  UserStatus,
} from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserFormComponent } from './components/user-form/user-form.component';

type DialogMode = 'none' | 'add' | 'edit' | 'view' | 'delete' | 'bulk-delete';

interface SortableColumn {
  field: UserSortField;
  label: string;
}

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    FormsModule,
    FocusTrapDirective,
    ConfirmDialogComponent,
    UserDetailComponent,
    UserFormComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = this.userService.isLoading;
  readonly error = this.userService.error;

  readonly searchQuery = signal('');
  readonly filters = signal<UserFilters>({
    status: 'all',
    role: 'all',
    department: 'all',
  });
  readonly sortField = signal<UserSortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly dialogMode = signal<DialogMode>('none');
  readonly activeUser = signal<User | null>(null);
  readonly formError = signal<string | null>(null);

  readonly sortableColumns: SortableColumn[] = [
    { field: 'fullName', label: 'Name' },
    { field: 'firstName', label: 'First name' },
    { field: 'lastName', label: 'Last name' },
    { field: 'email', label: 'Email' },
    { field: 'phone', label: 'Phone' },
    { field: 'role', label: 'Role' },
    { field: 'department', label: 'Department' },
    { field: 'status', label: 'Status' },
    { field: 'createdAt', label: 'Created' },
    { field: 'updatedAt', label: 'Updated' },
  ];

  readonly statusOptions: { value: UserStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  readonly roleOptions: { value: UserRole | 'all'; label: string }[] = [
    { value: 'all', label: 'All roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'User' },
    { value: 'viewer', label: 'Viewer' },
  ];

  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly paginatedResult = computed(() =>
    this.userService.queryUsers({
      search: this.searchQuery(),
      filters: this.filters(),
      sortField: this.sortField(),
      sortDirection: this.sortDirection(),
      page: this.currentPage(),
      pageSize: this.pageSize(),
    }),
  );

  readonly departments = computed(() => {
    const depts = new Set(
      this.userService.users().map((user) => user.department),
    );
    return Array.from(depts).sort();
  });

  readonly isEmpty = computed(() => this.userService.users().length === 0);
  readonly hasNoResults = computed(
    () => !this.isEmpty() && this.paginatedResult().total === 0,
  );

  readonly allPageSelected = computed(() => {
    const items = this.paginatedResult().items;
    if (items.length === 0) {
      return false;
    }
    const selected = this.selectedIds();
    return items.every((user) => selected.has(user.id));
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  ngOnInit(): void {
    this.userService.isLoading.set(true);
    queueMicrotask(() => {
      this.userService.isLoading.set(false);
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.get('action') === 'add') {
          this.openAdd();
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.clearSelection();
  }

  onFilterChange(
    key: keyof UserFilters,
    value: string,
  ): void {
    this.filters.update((current) => ({
      ...current,
      [key]: value,
    }));
    this.currentPage.set(1);
    this.clearSelection();
  }

  toggleSort(field: UserSortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIndicator(field: UserSortField): string {
    if (this.sortField() !== field) {
      return '';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.clearSelection();
  }

  goToPage(page: number): void {
    const { totalPages } = this.paginatedResult();
    const safePage = Math.min(Math.max(page, 1), totalPages);
    this.currentPage.set(safePage);
    this.clearSelection();
  }

  toggleSelectAll(checked: boolean): void {
    const items = this.paginatedResult().items;
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const user of items) {
        if (checked) {
          next.add(user.id);
        } else {
          next.delete(user.id);
        }
      }
      return next;
    });
  }

  toggleSelect(userId: string, checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }

  isSelected(userId: string): boolean {
    return this.selectedIds().has(userId);
  }

  openAdd(): void {
    this.activeUser.set(null);
    this.formError.set(null);
    this.dialogMode.set('add');
  }

  openEdit(user: User): void {
    this.activeUser.set(user);
    this.formError.set(null);
    this.dialogMode.set('edit');
  }

  openView(user: User): void {
    this.activeUser.set(user);
    this.dialogMode.set('view');
  }

  openDelete(user: User): void {
    this.activeUser.set(user);
    this.dialogMode.set('delete');
  }

  openBulkDelete(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.dialogMode.set('bulk-delete');
  }

  closeDialog(): void {
    this.dialogMode.set('none');
    this.activeUser.set(null);
    this.formError.set(null);
  }

  onUserSaved(user: User): void {
    this.closeDialog();
    this.clearSelection();
    void user;
  }

  onEditFromDetail(user: User): void {
    this.openEdit(user);
  }

  confirmDelete(): void {
    const user = this.activeUser();
    if (!user) {
      return;
    }

    const result = this.userService.deleteUser(user.id);
    if (!result.success) {
      this.formError.set(result.error);
      return;
    }

    this.closeDialog();
    this.clearSelection();
  }

  confirmBulkDelete(): void {
    const ids = Array.from(this.selectedIds());
    const result = this.userService.bulkDelete(ids);
    if (!result.success) {
      this.formError.set(result.error);
      return;
    }

    this.closeDialog();
    this.clearSelection();
  }

  bulkActivate(): void {
    const ids = Array.from(this.selectedIds());
    const result = this.userService.bulkActivate(ids);
    if (!result.success) {
      this.formError.set(result.error);
      return;
    }
    this.clearSelection();
  }

  bulkDeactivate(): void {
    const ids = Array.from(this.selectedIds());
    const result = this.userService.bulkDeactivate(ids);
    if (!result.success) {
      this.formError.set(result.error);
      return;
    }
    this.clearSelection();
  }

  getInitials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  formatRole(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'user':
        return 'User';
      case 'viewer':
        return 'Viewer';
    }
  }

  dismissError(): void {
    this.error.set(null);
    this.formError.set(null);
  }

  private clearSelection(): void {
    this.selectedIds.set(new Set());
  }
}
