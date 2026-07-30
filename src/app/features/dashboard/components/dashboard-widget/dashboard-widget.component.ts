import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-widget',
  template: `
    <section class="dashboard-widget" [attr.aria-labelledby]="headingId()">
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
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-bg-elevated);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .dashboard-widget-header {
        padding: 1rem 1.25rem 0.75rem;
        border-bottom: 1px solid var(--color-border);
      }

      .dashboard-widget-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .dashboard-widget-subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.8125rem;
        color: var(--color-text-muted);
      }

      .dashboard-widget-body {
        flex: 1;
        padding: 1.25rem;
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
