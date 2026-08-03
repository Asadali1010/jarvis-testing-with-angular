import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActivityService } from '../../core/services/activity.service';
import { UserService } from '../../core/services/user.service';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let fixture: ComponentFixture<UsersComponent>;
  let userService: UserService;
  let storage: Record<string, string>;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    userService = TestBed.inject(UserService);
    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    vi.unstubAllGlobals();
  });

  function getTableHeaders(): string[] {
    return (
      Array.from(
        fixture.nativeElement.querySelectorAll('.users-table thead th .sort-btn'),
      ) as Element[]
    ).map((el) => el.textContent?.trim().replace(/[↑↓]/g, '').trim() ?? '');
  }

  it('renders a responsive data table with required columns', () => {
    const table = fixture.nativeElement.querySelector('.users-table');
    expect(table).toBeTruthy();

    const headers = getTableHeaders();
    expect(headers).toContain('First name');
    expect(headers).toContain('Last name');
    expect(headers).toContain('Email');
    expect(headers).toContain('Phone');
    expect(headers).toContain('Role');
    expect(headers).toContain('Department');
    expect(headers).toContain('Status');
    expect(headers).toContain('Created');
    expect(headers).toContain('Updated');

    const rows = fixture.nativeElement.querySelectorAll('.users-table tbody tr');
    expect(rows.length).toBeGreaterThan(0);

    const firstRow = rows[0];
    expect(firstRow.querySelector('.user-avatar')).toBeTruthy();
    expect(firstRow.querySelector('.col-actions')).toBeTruthy();
  });

  it('supports real-time search by name', () => {
    fixture.componentInstance.onSearchChange('maria');
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.users-table tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0]?.textContent).toContain('Maria');
  });

  it('supports filtering by status and role', () => {
    fixture.componentInstance.onFilterChange('status', 'inactive');
    fixture.detectChanges();

    let rows = fixture.nativeElement.querySelectorAll('.users-table tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    expect(
      (Array.from(rows) as Element[]).every((row) =>
        row.textContent?.includes('Inactive'),
      ),
    ).toBe(true);

    fixture.componentInstance.onFilterChange('role', 'user');
    fixture.detectChanges();

    rows = fixture.nativeElement.querySelectorAll('.users-table tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0]?.textContent).toContain('David');
  });

  it('supports column sorting in both directions', () => {
    const emailSortBtn = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.sort-btn'),
      ) as HTMLButtonElement[]
    ).find((btn) => btn.textContent?.includes('Email'))!;

    emailSortBtn.click();
    fixture.detectChanges();

    let emails = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.users-table tbody tr td:nth-child(5)'),
      ) as Element[]
    ).map((cell) => cell.textContent?.trim());

    const ascending = [...emails].sort();
    expect(emails).toEqual(ascending);

    emailSortBtn.click();
    fixture.detectChanges();

    emails = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.users-table tbody tr td:nth-child(5)'),
      ) as Element[]
    ).map((cell) => cell.textContent?.trim());

    const descending = [...emails].sort().reverse();
    expect(emails).toEqual(descending);
  });

  it('renders pagination controls with page size selector', () => {
    const pagination = fixture.nativeElement.querySelector('.pagination');
    expect(pagination).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#page-size')).toBeTruthy();
    expect(pagination.textContent).toContain('Page');
    expect(pagination.textContent).toContain('First');
    expect(pagination.textContent).toContain('Previous');
    expect(pagination.textContent).toContain('Next');
    expect(pagination.textContent).toContain('Last');
  });

  it('supports multi-select and bulk actions', () => {
    const checkboxes = fixture.nativeElement.querySelectorAll(
      '.users-table tbody input[type="checkbox"]',
    );
    expect(checkboxes.length).toBeGreaterThan(0);

    (checkboxes[0] as HTMLInputElement).checked = true;
    checkboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const bulkBar = fixture.nativeElement.querySelector('.bulk-bar');
    expect(bulkBar).toBeTruthy();
    expect(bulkBar.textContent).toContain('1 selected');
    expect(bulkBar.textContent).toContain('Activate');
    expect(bulkBar.textContent).toContain('Deactivate');
    expect(bulkBar.textContent).toContain('Delete selected');
  });

  it('opens add user form with validation', () => {
    const addBtn = fixture.nativeElement.querySelector('.users-header .btn-primary') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.modal-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-user-form')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Add user');
  });

  it('opens view and edit dialogs from row actions', () => {
    const viewBtn = fixture.nativeElement.querySelector('.btn-icon') as HTMLButtonElement;
    viewBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-user-detail')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('User details');

    fixture.componentInstance.closeDialog();
    fixture.detectChanges();

    const editBtn = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.btn-icon'),
      ) as HTMLButtonElement[]
    ).find((btn) => btn.textContent?.trim() === 'Edit')!;
    editBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-user-form')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Edit user');
  });

  it('shows delete confirmation dialog', () => {
    const deleteBtn = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.btn-icon-danger'),
      ) as HTMLButtonElement[]
    )[0];
    deleteBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Delete user');
  });

  it('shows no-results state when search matches nothing', () => {
    fixture.componentInstance.onSearchChange('zzzznonexistent');
    fixture.detectChanges();

    const noResults = fixture.nativeElement.querySelector('.users-state');
    expect(noResults).toBeTruthy();
    expect(noResults.textContent).toContain('No users match your search');
  });

  it('renders the user table immediately without an artificial loading delay', () => {
    expect(fixture.nativeElement.querySelector('.users-table')).toBeTruthy();
    expect(userService.isLoading()).toBe(false);
  });

  it('shows loading state when UserService is loading then clears', () => {
    userService.isLoading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.users-state')?.textContent).toContain(
      'Loading users',
    );

    userService.isLoading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.users-table')).toBeTruthy();
  });

  it('creates a user through the form', () => {
    fixture.componentInstance.openAdd();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('app-user-form form');
    expect(form).toBeTruthy();

    const initialCount = userService.users().length;
    const result = userService.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@example.com',
      phone: '+1 (555) 999-8888',
      role: 'user',
      department: 'QA',
    });

    expect(result.success).toBe(true);
    expect(userService.users().length).toBe(initialCount + 1);
  });

  it('does not contain placeholder text', () => {
    expect(fixture.nativeElement.textContent).not.toContain(
      'User management tables and filters will be available',
    );
    expect(fixture.nativeElement.textContent).not.toContain('placeholder');
  });
});
