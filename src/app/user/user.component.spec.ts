import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserComponent } from './user.component';
import { UserFormComponent } from './user-form.component';
import { UserService } from './user.service';

/** Waits past the 500ms simulated API delay in UserFormComponent.onSubmit(). */
const waitForSubmit = () => new Promise(resolve => setTimeout(resolve, 700));

function buttonWithText(root: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(text)
  );
  if (!match) throw new Error(`No button containing "${text}"`);
  return match as HTMLButtonElement;
}

describe('UserComponent add-user flow', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      // Match production: the app runs with zoneless change detection.
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders the seeded users', async () => {
    const fixture = TestBed.createComponent(UserComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('john.doe@example.com');
  });

  it('shows a newly created user in the table', async () => {
    const fixture = TestBed.createComponent(UserComponent);
    await fixture.whenStable();

    buttonWithText(fixture.nativeElement, 'Add User').click();
    await fixture.whenStable();

    const form = fixture.debugElement.query(By.directive(UserFormComponent))
      .componentInstance as UserFormComponent;
    form.userForm.setValue({
      name: 'Test Person',
      email: 'test.person@example.com',
      department: 'QA',
      role: 'Editor',
      status: 'Active',
    });

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    // Deliberately no whenStable() here: the DOM must refresh on its own, which is
    // what proves change detection is notified despite the emit happening in a timer.
    await waitForSubmit();

    expect(fixture.nativeElement.textContent).toContain('test.person@example.com');
  });

  it('renders the dialog inside the page overlay instead of a second fixed overlay', async () => {
    const fixture = TestBed.createComponent(UserComponent);
    await fixture.whenStable();

    buttonWithText(fixture.nativeElement, 'Add User').click();
    await fixture.whenStable();

    const host = fixture.debugElement.query(By.directive(UserFormComponent))
      .nativeElement as HTMLElement;

    // Guard against a vacuous test: app-user-form is an unknown element and would
    // compute to `inline` if the component's own styles were not being applied.
    expect(getComputedStyle(host).display).toBe('block');

    // A fixed host resolves against the overlay's backdrop-filter/transform
    // containing block, collapsing it to zero height and hiding the form.
    expect(getComputedStyle(host).position).not.toBe('fixed');

    expect(fixture.nativeElement.querySelectorAll('.fixed.inset-0').length).toBe(1);
  });

  it('opens the form on load when the dashboard requested a create', async () => {
    // What DashboardComponent.addUser() does before navigating to /users.
    TestBed.inject(UserService).requestCreateUser();

    const fixture = TestBed.createComponent(UserComponent);
    await fixture.whenStable();

    expect(fixture.debugElement.query(By.directive(UserFormComponent))).toBeTruthy();
  });

  it('does not open the form on a plain visit to the Users page', async () => {
    const fixture = TestBed.createComponent(UserComponent);
    await fixture.whenStable();

    expect(fixture.debugElement.query(By.directive(UserFormComponent))).toBeNull();
  });

  it('clears the create request so it does not reopen on the next visit', async () => {
    TestBed.inject(UserService).requestCreateUser();

    const first = TestBed.createComponent(UserComponent);
    await first.whenStable();
    expect(first.debugElement.query(By.directive(UserFormComponent))).toBeTruthy();

    const second = TestBed.createComponent(UserComponent);
    await second.whenStable();
    expect(second.debugElement.query(By.directive(UserFormComponent))).toBeNull();
  });
});
