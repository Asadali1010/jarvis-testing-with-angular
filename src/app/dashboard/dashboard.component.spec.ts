import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { UserService } from '../user/user.service';

function buttonWithText(root: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(text)
  );
  if (!match) throw new Error(`No button containing "${text}"`);
  return match as HTMLButtonElement;
}

describe('DashboardComponent quick actions', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('sends the Add User quick action to the Users page with a create pending', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const router = TestBed.inject(Router);
    const userService = TestBed.inject(UserService);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    buttonWithText(fixture.nativeElement, 'Add User').click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/users']);
    expect(userService.consumeCreateUserRequest()).toBe(true);
  });

  it('leaves no create pending when Add User was never clicked', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(TestBed.inject(UserService).consumeCreateUserRequest()).toBe(false);
  });
});
