import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-widget',
  template: `
    <section class="dashboard-widget glass-panel" [attr.aria-labelledby]="headingId()">
      <header class="dashboard-widget-header">
        <h3 [id]="headingId()" class="dashboard-widget-title">{{ title() }}</h3>
        @if (subtitle()) {
          <p class="dashboard-widget-subtitle">{{ subtitle() }}</p>
        }
      </header>
      <div class="dashboard-widget-body">
        <ng-content />
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-widget {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding: 0;
        border-radius: var(--radius-card);
      }

      .dashboard-widget-header {
        padding: var(--space-5) var(--space-6) var(--space-4);
        border-bottom: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
      }

      .dashboard-widget-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--text-base);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        color: var(--color-text);
      }

      .dashboard-widget-subtitle {
        margin: var(--space-1) 0 0;
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--color-text-muted);
      }

      .dashboard-widget-body {
        flex: 1;
        padding: var(--space-6);
        min-height: 0;
      }
    `,
  ],
})
export class DashboardWidgetComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly headingId = input.required<string>();
}
