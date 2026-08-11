import { Component, input, output } from '@angular/core';

import { FocusTrapDirective } from '../../../../core/directives/focus-trap.directive';

@Component({
  selector: 'app-confirm-dialog',
  imports: [FocusTrapDirective],
  template: `
    @if (open()) {
      <div
        class="dialog-backdrop"
        role="presentation"
        (click)="onCancel()"
      >
        <div
          class="dialog-panel"
          role="alertdialog"
          [attr.aria-labelledby]="dialogId + '-title'"
          [attr.aria-describedby]="dialogId + '-message'"
          [appFocusTrap]="open()"
          (escape)="onCancel()"
          tabindex="-1"
          (click)="$event.stopPropagation()"
        >
          <h3 [id]="dialogId + '-title'" class="dialog-title">{{ title() }}</h3>
          <p [id]="dialogId + '-message'" class="dialog-message">{{ message() }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              class="btn btn-danger"
              (click)="onConfirm()"
              [attr.aria-label]="confirmLabel()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: color-mix(in srgb, var(--color-bg) 55%, transparent);
      }

      @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .dialog-backdrop {
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
        }
      }

      .dialog-panel {
        width: 100%;
        max-width: 24rem;
        padding: var(--space-6);
        border-radius: var(--radius-xl);
        border: 1px solid var(--glass-border);
        box-shadow: var(--shadow-xl);
      }

      @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .dialog-panel {
          background: var(--glass-background);
          backdrop-filter: blur(var(--glass-blur)) saturate(1.15);
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.15);
        }
      }

      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .dialog-panel {
          background: var(--color-bg-elevated);
        }
      }

      .dialog-title {
        margin: 0 0 var(--space-2);
        font-family: var(--font-display);
        font-size: var(--text-lg);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        color: var(--color-text);
      }

      .dialog-message {
        margin: 0 0 var(--space-5);
        font-size: var(--text-sm);
        line-height: var(--leading-relaxed);
        color: var(--color-text-muted);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to proceed?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly dialogId = `confirm-${Math.random().toString(36).slice(2, 9)}`;

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
