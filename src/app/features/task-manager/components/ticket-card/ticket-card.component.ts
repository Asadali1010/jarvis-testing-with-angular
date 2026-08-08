import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../../../core/models/ticket.model';
import { User } from '../../../../core/models/user.model';
import {
  formatUserDisplayName,
  getUserInitials,
} from '../../../../core/utils/user-display.util';

@Component({
  selector: 'app-ticket-card',
  imports: [DatePipe, FormsModule],
  templateUrl: './ticket-card.component.html',
  styles: [
    `
      .ticket-card {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        padding: 1rem;
        border-radius: var(--radius-md);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .ticket-card:hover {
        border-color: color-mix(in srgb, var(--color-primary) 35%, var(--glass-border));
        box-shadow: var(--glass-shadow);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .card-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-text);
        line-height: 1.35;
      }

      .priority-badge {
        flex-shrink: 0;
        padding: 0.125rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .priority-low {
        background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
        color: var(--color-text-muted);
      }

      .priority-medium {
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        color: var(--color-primary);
      }

      .priority-high {
        background: color-mix(in srgb, #f59e0b 18%, transparent);
        color: #b45309;
      }

      .priority-urgent {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
      }

      .card-description {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--color-text-muted);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }

      .card-meta time {
        font-variant-numeric: tabular-nums;
      }

      .card-controls {
        display: grid;
        gap: 0.625rem;
      }

      .control-field label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-muted);
      }

      .control-field select {
        width: 100%;
        padding: 0.375rem 0.625rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-bg-muted);
        color: var(--color-text);
        font-size: 0.8125rem;
      }

      .control-field select:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 1px;
      }

      .assignee-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .assignee-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: var(--radius-sm);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-muted)),
          var(--color-bg-muted)
        );
        font-size: 0.625rem;
        font-weight: 700;
        color: var(--color-primary);
      }

      @media (prefers-reduced-motion: reduce) {
        .ticket-card {
          transition: none;
        }
      }
    `,
  ],
})
export class TicketCardComponent {
  readonly ticket = input.required<Ticket>();
  readonly users = input<User[]>([]);

  readonly statusChange = output<TicketStatus>();
  readonly assignChange = output<string | null>();

  readonly formatUserDisplayName = formatUserDisplayName;
  readonly getUserInitials = getUserInitials;

  readonly statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];

  readonly assignee = computed(() => {
    const assigneeId = this.ticket().assigneeId;
    if (!assigneeId) {
      return null;
    }
    return this.users().find((user) => user.id === assigneeId) ?? null;
  });

  priorityLabel(priority: TicketPriority): string {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'urgent':
        return 'Urgent';
    }
  }

  onStatusChange(value: TicketStatus): void {
    if (value !== this.ticket().status) {
      this.statusChange.emit(value);
    }
  }

  onAssignChange(value: string): void {
    const next = value.trim() ? value : null;
    if (next !== this.ticket().assigneeId) {
      this.assignChange.emit(next);
    }
  }
}
