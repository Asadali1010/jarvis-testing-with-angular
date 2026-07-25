import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UploadDocumentsComponent } from './upload-documents.component';
import { DashboardComponent } from '../../../dashboard/dashboard.component';

function buttonWithText(root: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(text)
  );
  if (!match) throw new Error(`No button containing "${text}"`);
  return match as HTMLButtonElement;
}

describe('Upload documents dialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, UploadDocumentsComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('is closed until the dashboard quick action is clicked', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Upload Documents');

    buttonWithText(fixture.nativeElement, 'Upload Docs').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Upload Documents');
  });

  it('renders above the sticky header rather than under it', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();

    buttonWithText(fixture.nativeElement, 'Upload Docs').click();
    await fixture.whenStable();

    // Bootstrap's unlayered .sticky-top sets z-index 1020 on the app header.
    const overlay = fixture.nativeElement.querySelector('.fixed.inset-0') as HTMLElement;
    expect(overlay.className).toContain('z-[1055]');
  });

  it('opens the file picker from the drop zone exactly once', async () => {
    const fixture = TestBed.createComponent(UploadDocumentsComponent);
    fixture.componentInstance.isOpen = true;
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const dropZone = input.parentElement as HTMLElement;

    // A real input.click() dispatches a BUBBLING click. Reproduce that (capped, so a
    // regression fails the assertion instead of blowing the stack) — the input sits
    // inside the drop zone, so without stopPropagation this re-enters the handler.
    let opens = 0;
    input.click = function () {
      opens++;
      if (opens < 20) this.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };

    dropZone.click();

    expect(opens).toBe(1);
  });
});
