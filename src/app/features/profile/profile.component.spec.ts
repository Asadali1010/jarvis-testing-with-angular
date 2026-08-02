import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AUTH_CREDENTIALS } from '../../core/constants/auth.constants';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../core/services/auth-storage';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { ProfileComponent } from './profile.component';

class InMemoryAuthStorage implements AuthStorage {
  private token: string | null = null;
  private user: AuthUser | null = null;

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  setToken(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
  }

  clear(): void {
    this.token = null;
    this.user = null;
  }
}

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let authStorage: InMemoryAuthStorage;
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
      imports: [ProfileComponent],
      providers: [
        AuthService,
        UserService,
        ProfileService,
        ActivityService,
        { provide: AUTH_STORAGE, useClass: InMemoryAuthStorage },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    authStorage = TestBed.inject(AUTH_STORAGE) as InMemoryAuthStorage;
    authStorage.setToken('mock-token', { email: AUTH_CREDENTIALS.email });

    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function getDetailValue(label: string): string | undefined {
    const items = fixture.nativeElement.querySelectorAll('.profile-details > div');
    for (const item of Array.from(items) as HTMLElement[]) {
      const dt = item.querySelector('dt');
      if (dt?.textContent?.trim() === label) {
        return item.querySelector('dd')?.textContent?.trim();
      }
    }
    return undefined;
  }

  function clickEditProfile(): void {
    const button = fixture.nativeElement.querySelector(
      '.profile-actions .btn-primary',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  function getProfileForm(): ProfileFormComponent {
    return fixture.debugElement.query(By.directive(ProfileFormComponent))
      .componentInstance as ProfileFormComponent;
  }

  function submitProfileForm(): void {
    getProfileForm().onSubmit();
    fixture.detectChanges();
  }

  it('displays profile avatar and name for the authenticated user', () => {
    expect(fixture.nativeElement.querySelector('.profile-avatar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.profile-name')?.textContent?.trim()).toBe(
      'Admin User',
    );
  });

  it('displays email, phone, address, bio, company, department, role, and member since', () => {
    expect(getDetailValue('Email')).toBe(AUTH_CREDENTIALS.email);
    expect(getDetailValue('Phone')).toBe('+1 (555) 000-0000');
    expect(getDetailValue('Address')).toBe('123 Enterprise Way, Suite 100');
    expect(getDetailValue('Bio')).toBe('System administrator for Jarvis Enterprise.');
    expect(getDetailValue('Company')).toBe('Jarvis Corp');
    expect(getDetailValue('Department')).toBe('Administration');
    expect(getDetailValue('Role')).toBe('Administrator');
    expect(getDetailValue('Member since')).toBeTruthy();
  });

  it('does not contain placeholder text', () => {
    expect(fixture.nativeElement.textContent).not.toContain('will appear here');
    expect(fixture.nativeElement.textContent).not.toContain('placeholder');
  });

  it('shows a sign-in message when no authenticated user is available', () => {
    authStorage.clear();
    TestBed.inject(AuthService).logout();
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.profile-empty')?.textContent).toContain(
      'Sign in to view your profile information',
    );
    expect(fixture.nativeElement.querySelector('.profile-actions')).toBeNull();
  });

  it('shows an Edit profile button in view mode when authenticated', () => {
    const button = fixture.nativeElement.querySelector('.profile-actions .btn-primary');
    expect(button?.textContent?.trim()).toBe('Edit profile');
  });

  it('switches to edit mode and shows the form when Edit profile is clicked', () => {
    clickEditProfile();

    expect(fixture.nativeElement.querySelector('.profile-details')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-profile-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#profile-heading')?.textContent?.trim()).toBe(
      'Edit profile',
    );
  });

  it('pre-fills the edit form with current profile values', () => {
    clickEditProfile();

    const firstName = fixture.nativeElement.querySelector(
      '#profile-firstName',
    ) as HTMLInputElement;
    const phone = fixture.nativeElement.querySelector('#profile-phone') as HTMLInputElement;

    expect(firstName.value).toBe('Admin');
    expect(phone.value).toBe('+1 (555) 000-0000');
  });

  it('returns to view mode without saving when Cancel is clicked', () => {
    clickEditProfile();
    getProfileForm().form.patchValue({ firstName: 'Changed' });

    const cancelButton = fixture.nativeElement.querySelector(
      '.form-actions .btn-secondary',
    ) as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.profile-details')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.profile-name')?.textContent?.trim()).toBe(
      'Admin User',
    );
  });

  it('updates the displayed name after a successful save', () => {
    clickEditProfile();
    getProfileForm().form.patchValue({ firstName: 'Updated' });
    submitProfileForm();

    expect(fixture.nativeElement.querySelector('.profile-name')?.textContent?.trim()).toBe(
      'Updated User',
    );
  });

  it('shows a field error and stays in edit mode when phone is invalid', () => {
    clickEditProfile();
    getProfileForm().form.patchValue({ phone: '123' });
    submitProfileForm();

    expect(fixture.nativeElement.querySelector('#profile-phone-error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-profile-form')).toBeTruthy();
  });

  it('shows a success banner after a successful save', () => {
    clickEditProfile();
    getProfileForm().form.patchValue({ firstName: 'Saved' });
    submitProfileForm();

    expect(fixture.nativeElement.querySelector('.profile-banner--success')?.textContent).toContain(
      'Profile updated successfully.',
    );
  });

  it('does not expose editable inputs for email, role, or department', () => {
    clickEditProfile();

    expect(fixture.nativeElement.querySelector('#profile-email')).toBeNull();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Contact your administrator to change your email.',
    );
  });
});
