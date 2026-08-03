import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[appFocusTrap]',
})
export class FocusTrapDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly active = input(true, { alias: 'appFocusTrap' });
  readonly escape = output<void>();

  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.active()) {
        this.captureFocus();
      } else {
        this.restoreFocus();
      }
    });
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.active()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.escape.emit();
      return;
    }

    if (event.key === 'Tab') {
      this.handleTab(event);
    }
  }

  private captureFocus(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    queueMicrotask(() => {
      const focusable = this.getFocusableElements();
      const target = focusable[0] ?? this.el.nativeElement;
      target.focus();
    });
  }

  private restoreFocus(): void {
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
      this.previouslyFocused = null;
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => {
      if (element.hasAttribute('disabled') || element.getAttribute('tabindex') === '-1') {
        return false;
      }

      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private handleTab(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
