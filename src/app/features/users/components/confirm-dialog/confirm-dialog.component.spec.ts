import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Delete user');
    fixture.componentRef.setInput('message', 'This action cannot be undone.');
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.componentRef.setInput('cancelLabel', 'Keep user');
    fixture.detectChanges();
  });

  function getDialogPanel(): HTMLElement {
    return fixture.nativeElement.querySelector('.dialog-panel') as HTMLElement;
  }

  function getFocusableElements(): HTMLElement[] {
    return Array.from(
      getDialogPanel().querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  it('exposes alertdialog semantics with labelled and described content', () => {
    const panel = getDialogPanel();

    expect(panel.getAttribute('role')).toBe('alertdialog');
    expect(panel.getAttribute('aria-labelledby')).toBeTruthy();
    expect(panel.getAttribute('aria-describedby')).toBeTruthy();

    const titleId = panel.getAttribute('aria-labelledby');
    const messageId = panel.getAttribute('aria-describedby');

    expect(fixture.nativeElement.querySelector(`#${titleId}`)?.textContent?.trim()).toBe(
      'Delete user',
    );
    expect(fixture.nativeElement.querySelector(`#${messageId}`)?.textContent?.trim()).toBe(
      'This action cannot be undone.',
    );
  });

  it('provides an accessible label on the destructive confirm action', () => {
    const confirmButton = fixture.nativeElement.querySelector(
      '.btn-danger',
    ) as HTMLButtonElement;

    expect(confirmButton.getAttribute('aria-label')).toBe('Delete');
    expect(confirmButton.textContent?.trim()).toBe('Delete');
  });

  it('traps keyboard focus within the dialog on Tab', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const focusable = getFocusableElements();
    expect(focusable.length).toBeGreaterThanOrEqual(2);

    for (const element of focusable) {
      Object.defineProperty(element, 'offsetParent', {
        configurable: true,
        value: document.body,
      });
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first.focus();
    expect(document.activeElement).toBe(first);

    last.focus();
    expect(document.activeElement).toBe(last);

    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(last);
  });

  it('emits cancelled when Escape is pressed inside the dialog', () => {
    const cancelledSpy = vi.spyOn(fixture.componentInstance.cancelled, 'emit');

    getDialogPanel().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('does not render dialog markup when closed', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dialog-panel')).toBeNull();
  });

  it('emits confirmed and cancelled outputs from action buttons', () => {
    const confirmedSpy = vi.spyOn(fixture.componentInstance.confirmed, 'emit');
    const cancelledSpy = vi.spyOn(fixture.componentInstance.cancelled, 'emit');

    (
      fixture.nativeElement.querySelector('.btn-danger') as HTMLButtonElement
    ).click();
    expect(confirmedSpy).toHaveBeenCalled();

    (
      fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement
    ).click();
    expect(cancelledSpy).toHaveBeenCalled();
  });
});
