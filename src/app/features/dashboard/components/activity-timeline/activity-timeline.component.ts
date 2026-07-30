import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { ActivityEvent } from '../../../../core/models/activity.model';

@Component({
  selector: 'app-activity-timeline',
  imports: [DatePipe],
  template: `
    <section class="activity-timeline" aria-labelledby="activity-timeline-heading">
      <h3 id="activity-timeline-heading" class="activity-timeline-heading">
        Recent Activity
      </h3>

      @if (isLoading()) {
        <div class="activity-state" role="status" aria-live="polite">
          <span class="activity-spinner" aria-hidden="true"></span>
          <p>Loading recent activity…</p>
        </div>
      } @else if (activities().length === 0) {
        <div class="activity-state activity-empty" role="status">
          <p>No recent activity yet.</p>
          <p class="activity-empty-hint">
            User actions and system events will appear here.
          </p>
        </div>
      } @else {
        <ol class="activity-list">
          @for (event of activities(); track event.id) {
            <li class="activity-item">
              <span class="activity-icon" [attr.data-type]="event.type" aria-hidden="true">
                @switch (event.type) {
                  @case ('login') {
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M10 17l5-5-5-5v3H3v4h7v3zm9-9h-2v14h2V8z"
                      />
                    </svg>
                  }
                  @case ('user_create') {
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8H4v2H2v2h2v2h2v-2h2v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  }
                  @case ('user_update') {
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                      />
                    </svg>
                  }
                  @case ('profile_change') {
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  }
                  @default {
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.488.488 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.36 2.54a7.03 7.03 0 0 0-1.63.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.24.41.49.41h4c.25 0 .44-.17.49-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
                      />
                    </svg>
                  }
                }
              </span>
              <div class="activity-content">
                <p class="activity-title">{{ event.title }}</p>
                <p class="activity-description">{{ event.description }}</p>
                <time
                  class="activity-time"
                  [attr.datetime]="event.timestamp"
                >
                  {{ event.timestamp | date: 'medium' }}
                </time>
              </div>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [
    `
      .activity-timeline {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .activity-timeline-heading {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .activity-list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 18rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .activity-item {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 0.75rem;
        border-radius: var(--radius-md);
        background: var(--color-bg-muted);
      }

      .activity-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: var(--radius-sm);
        background: var(--color-bg-elevated);
        color: var(--color-primary);
      }

      .activity-content {
        min-width: 0;
        flex: 1;
      }

      .activity-title {
        margin: 0 0 0.125rem;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .activity-description {
        margin: 0 0 0.25rem;
        font-size: 0.875rem;
        color: var(--color-text-muted);
      }

      .activity-time {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }

      .activity-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem 1rem;
        text-align: center;
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
      }

      .activity-state p {
        margin: 0;
      }

      .activity-empty-hint {
        font-size: 0.875rem;
      }

      .activity-spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .activity-spinner {
          animation: none;
          border-top-color: var(--color-border);
        }
      }
    `,
  ],
})
export class ActivityTimelineComponent {
  readonly activities = input<ActivityEvent[]>([]);
  readonly isLoading = input(false);
}
