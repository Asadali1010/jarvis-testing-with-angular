import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActivityService } from '../../../../core/services/activity.service';
import { UserService } from '../../../../core/services/user.service';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let fixture: ComponentFixture<UserFormComponent>;
  let component: UserFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
  });

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
  }

  function setInputValue(id: string, value: string): void {
    const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function getFieldErrors(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.field-error')).map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

  it('shows required-field validation messages on submit', () => {
    getSubmitButton().click();
    fixture.detectChanges();

    const errors = getFieldErrors();
    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
    expect(errors).toContain('Email is required.');
    expect(errors).toContain('Phone is required.');
    expect(errors).toContain('Department is required.');
  });

  it('shows email format validation for invalid addresses', () => {
    setInputValue('firstName', 'Jane');
    setInputValue('lastName', 'Doe');
    setInputValue('email', 'not-an-email');
    setInputValue('phone', '+1 (555) 123-4567');
    setInputValue('department', 'Engineering');

    getSubmitButton().click();
    fixture.detectChanges();

    expect(getFieldErrors()).toContain('Enter a valid email address.');
  });

  it('shows phone validation for numbers with too few digits', () => {
    setInputValue('firstName', 'Jane');
    setInputValue('lastName', 'Doe');
    setInputValue('email', 'jane.doe@example.com');
    setInputValue('phone', '123');
    setInputValue('department', 'Engineering');

    getSubmitButton().click();
    fixture.detectChanges();

    expect(getFieldErrors()).toContain('Enter a valid phone number.');
  });

  it('accepts valid form input without validation errors', () => {
    const savedSpy = vi.spyOn(component.saved, 'emit');

    setInputValue('firstName', 'Jane');
    setInputValue('lastName', 'Doe');
    setInputValue('email', 'jane.doe@example.com');
    setInputValue('phone', '+1 (555) 123-4567');
    setInputValue('department', 'Engineering');

    getSubmitButton().click();
    fixture.detectChanges();

    expect(getFieldErrors()).toHaveLength(0);
    expect(savedSpy).toHaveBeenCalled();
  });

  it('associates each input with a visible label', () => {
    expect(fixture.nativeElement.querySelector('label[for="firstName"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('label[for="lastName"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('label[for="email"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('label[for="phone"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('label[for="department"]')).toBeTruthy();
  });
});
