import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AUTH_CREDENTIALS } from '../../../../core/constants/auth.constants';
import { User } from '../../../../core/models/user.model';
import { AUTH_STORAGE, AuthStorage, AuthUser } from '../../../../core/services/auth-storage';
import { ActivityService } from '../../../../core/services/activity.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { UserService } from '../../../../core/services/user.service';
import { ProfileFormComponent } from './profile-form.component';

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

describe('ProfileFormComponent', () => {
  let fixture: ComponentFixture<ProfileFormComponent>;
  let component: ProfileFormComponent;
  let authStorage: InMemoryAuthStorage;
  let storage: Record<string, string>;

  const adminProfile: User = {
    id: 'user-1',
    firstName: 'Admin',
    lastName: 'User',
    email: AUTH_CREDENTIALS.email,
    phone: '+1 (555) 000-0000',
    role: 'admin',
    department: 'Administration',
    status: 'active',
    address: '123 Enterprise Way, Suite 100',
    bio: 'System administrator for Jarvis Enterprise.',
    company: 'Jarvis Corp',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-07-01T14:30:00.000Z',
  };

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
      imports: [ProfileFormComponent],
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

    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', adminProfile);
    component.patchFromUser(adminProfile);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders editable profile fields and read-only account rows', () => {
    expect(fixture.nativeElement.querySelector('#profile-firstName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#profile-bio')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Contact your administrator to change your email.',
    );
  });

  it('handles valid image upload', async () => {
    const file = new File(['(fake-image-binary)'], 'test.png', { type: 'image/png' });
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    
    // Mocking HTMLInputElement.files is tricky, we call onFileSelected directly or simulate event
    const event = { target: { files: [file] } } as any;
    component.onFileSelected(event);
    fixture.detectChanges();

    expect(component.previewUrl()).toBeTruthy();
    expect(component.avatarError()).toBeNull();
  });

  it('rejects invalid image formats', () => {
    const file = new File(['(fake-text-binary)'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;
    component.onFileSelected(event);
    fixture.detectChanges();

    expect(component.previewUrl()).toBeNull();
    expect(component.avatarError()).toBe('Unsupported file format. Please use JPG, JPEG, PNG, or WEBP.');
  });

  it('rejects oversized images', () => {
    const largeFile = new File(['a'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const event = { target: { files: [largeFile] } } as any;
    component.onFileSelected(event);
    fixture.detectChanges();

    expect(component.previewUrl()).toBeNull();
    expect(component.avatarError()).toBe('Image size must be 2MB or less.');
  });

  it('removes image when removeImage is called', () => {
    component.previewUrl.set('some-url');
    component.removeImage();
    fixture.detectChanges();

    expect(component.previewUrl()).toBeNull();
  });

  it('includes avatar in profile update on submit', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    component.previewUrl.set('data:image/png;base64,mock');
    component.form.patchValue({ firstName: 'AvatarUser' });
    component.onSubmit();

    expect(savedSpy).toHaveBeenCalledWith(
      expect.objectContaining({ 
        firstName: 'AvatarUser',
        avatar: 'data:image/png;base64,mock' 
      }),
    );
  });

  it('emits saved when the form submits valid changes', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    component.form.patchValue({ firstName: 'Saved' });
    component.onSubmit();

    expect(savedSpy).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Saved' }),
    );
  });

  it('shows a server error when profile update fails', () => {
    authStorage.clear();
    TestBed.inject(AuthService).logout();

    component.onSubmit();

    expect(component.serverError()).toBe('Sign in to update your profile.');
  });

  it('emits cancelled when Cancel is clicked', () => {
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    const cancelButton = fixture.nativeElement.querySelector(
      '.form-actions .btn-secondary',
    ) as HTMLButtonElement;
    cancelButton.click();

    expect(cancelledSpy).toHaveBeenCalled();
  });
});
