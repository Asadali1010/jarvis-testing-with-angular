import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityService } from '../../../../core/services/activity.service';
import { UserService } from '../../../../core/services/user.service';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let fixture: ComponentFixture<UserFormComponent>;
  let component: UserFormComponent;

  beforeEach(async () => {
    const storage: Record<string, string> = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
    });

    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    vi.unstubAllGlobals();
  });

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
  }

  it('shows validation messages for required fields', () => {
    getSubmitButton().click();
    fixture.detectChanges();

    const errors = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.field-error'),
      ) as Element[]
    ).map((element) => element.textContent?.trim());

    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
    expect(errors).toContain('Email is required.');
    expect(errors).toContain('Phone is required.');
    expect(errors).toContain('Department is required.');
  });

  it('sets aria-invalid on invalid fields after submit', () => {
    getSubmitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#firstName')?.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#lastName')?.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#email')?.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#phone')?.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#department')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not set aria-invalid on valid fields', () => {
    component.form.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1 (555) 123-4567',
      department: 'Engineering',
    });

    getSubmitButton().click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#firstName')?.getAttribute('aria-invalid'),
    ).not.toBe('true');
    expect(
      fixture.nativeElement.querySelector('#email')?.getAttribute('aria-invalid'),
    ).not.toBe('true');
  });

  it('shows an email format validation message', () => {
    component.form.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'not-an-email',
      phone: '+1 (555) 123-4567',
      department: 'Engineering',
    });

    getSubmitButton().click();
    fixture.detectChanges();

    const emailError = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.field-error'),
      ) as Element[]
    ).find((element) => element.textContent?.includes('valid email'));

    expect(emailError?.textContent?.trim()).toBe('Enter a valid email address.');
  });

  it('emits saved when the form submits valid data', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    component.form.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1 (555) 123-4567',
      department: 'Engineering',
    });

    getSubmitButton().click();
    fixture.detectChanges();

    expect(savedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      }),
    );
  });
});
