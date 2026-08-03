import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusTrapDirective } from './focus-trap.directive';

@Component({
  imports: [FocusTrapDirective],
  template: `
    <div [appFocusTrap]="active()" (escape)="onEscape()">
      <button id="first" type="button">First</button>
      <button id="second" type="button">Second</button>
    </div>
  `,
})
class FocusTrapHostComponent {
  readonly active = signal(true);
  escaped = false;

  onEscape(): void {
    this.escaped = true;
  }
}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<FocusTrapHostComponent>;
  let host: FocusTrapHostComponent;
  let container: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusTrapHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FocusTrapHostComponent);
    host = fixture.componentInstance;
    container = fixture.nativeElement.querySelector('div');
    fixture.detectChanges();
  });

  function dispatchKey(key: string, options: KeyboardEventInit = {}): void {
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, ...options }),
    );
  }

  it('focuses the first focusable element when activated', async () => {
    await Promise.resolve();

    const first = fixture.nativeElement.querySelector('#first') as HTMLButtonElement;
    expect(document.activeElement).toBe(first);
  });

  it('wraps Tab focus from last to first element', async () => {
    await Promise.resolve();

    const first = fixture.nativeElement.querySelector('#first') as HTMLButtonElement;
    const second = fixture.nativeElement.querySelector('#second') as HTMLButtonElement;

    second.focus();
    dispatchKey('Tab');

    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab focus from first to last element', async () => {
    await Promise.resolve();

    const first = fixture.nativeElement.querySelector('#first') as HTMLButtonElement;
    const second = fixture.nativeElement.querySelector('#second') as HTMLButtonElement;

    first.focus();
    dispatchKey('Tab', { shiftKey: true });

    expect(document.activeElement).toBe(second);
  });

  it('emits escape when Escape is pressed', () => {
    dispatchKey('Escape');

    expect(host.escaped).toBe(true);
  });

  it('does not trap keys when inactive', async () => {
    host.active.set(false);
    fixture.detectChanges();
    await Promise.resolve();

    dispatchKey('Escape');

    expect(host.escaped).toBe(false);
  });
});
