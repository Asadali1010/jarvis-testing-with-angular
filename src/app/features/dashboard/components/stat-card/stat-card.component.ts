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
        gap: 1rem;
        align-items: flex-start;
        padding: 1.25rem;
        border-radius: var(--radius-lg);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--glass-shadow);
        border-color: var(--color-primary);
      }

      .stat-card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: var(--radius-md);
        background: var(--color-bg-muted);
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
        margin: 0 0 0.25rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-card-value {
        margin: 0;
        font-size: 1.625rem;
        font-weight: 700;
        line-height: 1.2;
        color: var(--color-text);
      }

      .stat-card-trend {
        margin: 0.375rem 0 0;
        font-size: 0.8125rem;
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
        .stat-card {
          transition: none;
        }

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
