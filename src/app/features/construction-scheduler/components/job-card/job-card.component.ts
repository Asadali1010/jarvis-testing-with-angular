import { Component, computed, input, output } from '@angular/core';

import {
  ConstructionJob,
  ConstructionJobStatus,
} from '../../../../core/models/construction-job.model';
import { User } from '../../../../core/models/user.model';
import {
  formatUserDisplayName,
  getUserInitials,
} from '../../../../core/utils/user-display.util';

@Component({
  selector: 'app-job-card',
  imports: [],
  templateUrl: './job-card.component.html',
  styles: [
    `
      .job-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        transition: var(--transition-interactive);
      }

      .job-card:hover {
        border-color: color-mix(in srgb, var(--color-primary) 35%, var(--glass-border));
        box-shadow: var(--shadow-md);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .card-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--text-sm);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        color: var(--color-text);
        line-height: var(--leading-normal);
      }

      .status-badge {
        flex-shrink: 0;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .status-scheduled {
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        color: var(--color-primary);
      }

      .status-in-progress {
        background: color-mix(in srgb, var(--color-accent) 18%, transparent);
        color: var(--color-accent);
      }

      .status-delayed {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
      }

      .status-completed {
        background: color-mix(in srgb, var(--color-success) 18%, transparent);
        color: var(--color-success);
      }

      .card-site {
        margin: 0;
        font-size: var(--text-xs);
        line-height: var(--leading-relaxed);
        color: var(--color-text-muted);
      }

      .crew-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .crew-label {
        margin: 0;
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-text-muted);
      }

      .crew-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .crew-member {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        background: var(--color-bg-muted);
        font-size: var(--text-xs);
        color: var(--color-text);
      }

      .crew-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: var(--radius-sm);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-muted)),
          var(--color-bg-muted)
        );
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--color-primary);
      }

      .crew-empty {
        margin: 0;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border);
      }

      .btn-icon {
        min-height: 2.25rem;
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
      }

      @media (prefers-reduced-motion: reduce) {
        .job-card {
          transition: none;
        }
      }
    `,
  ],
})
export class JobCardComponent {
  readonly job = input.required<ConstructionJob>();
  readonly users = input<User[]>([]);

  readonly edit = output<ConstructionJob>();
  readonly delete = output<ConstructionJob>();

  readonly formatUserDisplayName = formatUserDisplayName;
  readonly getUserInitials = getUserInitials;

  readonly crewMembers = computed(() => {
    const crewIds = this.job().crewIds;
    if (!crewIds.length) {
      return [];
    }
    return crewIds
      .map((id) => this.users().find((user) => user.id === id))
      .filter((user): user is User => !!user);
  });

  statusLabel(status: ConstructionJobStatus): string {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In progress';
      case 'delayed':
        return 'Delayed';
      case 'completed':
        return 'Completed';
    }
  }

  statusClass(status: ConstructionJobStatus): string {
    return `status-${status}`;
  }
}
