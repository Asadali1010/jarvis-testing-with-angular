import { Component, input } from '@angular/core';

export type StatTrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat-card glass-card" [attr.aria-label]="title() + ': ' + value()">
      <div class="stat-card-icon" aria-hidden="true">
        <ng-content select="[statIcon]" />
      </div>
      <div class="stat-card-body">
        <h3 class="stat-card-title">{{ title() }}</h3>
        <p class="stat-card-value">{{ value() }}</p>
        @if (trend()) {
          <p
            class="stat-card-trend"
            [class.trend-up]="trendDirection() === 'up'"
            [class.trend-down]="trendDirection() === 'down'"
            [class.trend-neutral]="trendDirection() === 'neutral'"
          >
            {{ trend() }}
          </p>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .stat-card {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        transition: var(--transition-interactive);
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        border-color: color-mix(in srgb, var(--color-primary) 28%, var(--glass-border));
      }

      .stat-card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-primary) 12%, var(--color-bg-muted));
        color: var(--color-primary);
      }

      .stat-card-icon :global(svg) {
        width: 1.375rem;
        height: 1.375rem;
      }

      .stat-card-body {
        min-width: 0;
        flex: 1;
      }

      .stat-card-title {
        margin: 0 0 var(--space-1);
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .stat-card-value {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--text-2xl);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        line-height: var(--leading-tight);
        color: var(--color-text);
      }

      .stat-card-trend {
        margin: var(--space-2) 0 0;
        font-size: var(--text-xs);
        font-weight: 500;
      }

      .trend-up {
        color: var(--color-success);
      }

      .trend-down {
        color: var(--color-danger);
      }

      .trend-neutral {
        color: var(--color-text-muted);
      }

      @media (prefers-reduced-motion: reduce) {
        .stat-card:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly trend = input<string | undefined>(undefined);
  readonly trendDirection = input<StatTrendDirection>('neutral');
}
