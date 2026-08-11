import { DatePipe } from '@angular/common';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
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
  imports: [CdkDragHandle, DatePipe, FormsModule],
  templateUrl: './ticket-card.component.html',
  styles: [
    `
      .ticket-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        transition: var(--transition-interactive);
      }

      .ticket-card:hover {
        border-color: color-mix(in srgb, var(--color-primary) 35%, var(--glass-border));
        box-shadow: var(--shadow-md);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .card-header-main {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        flex: 1;
        min-width: 0;
      }

      .drag-handle {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        margin-top: var(--space-1);
        padding: 0;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--color-text-muted);
        cursor: grab;
        touch-action: none;
        transition: var(--transition-interactive);
      }

      .drag-handle:hover {
        color: var(--color-text);
        background: color-mix(in srgb, var(--color-text-muted) 12%, transparent);
      }

      .drag-handle:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 1px;
      }

      .drag-handle:active {
        cursor: grabbing;
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

      .priority-badge {
        flex-shrink: 0;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
        background: color-mix(in srgb, var(--color-accent) 18%, transparent);
        color: var(--color-accent);
      }

      .priority-urgent {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
      }

      .card-description {
        margin: 0;
        font-size: var(--text-xs);
        line-height: var(--leading-relaxed);
        color: var(--color-text-muted);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        align-items: center;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .card-meta time {
        font-variant-numeric: tabular-nums;
      }

      .card-controls {
        display: grid;
        gap: var(--space-3);
      }

      .control-field label {
        display: block;
        margin-bottom: var(--space-1);
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .control-field select {
        width: 100%;
        min-height: 2.25rem;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-bg-muted);
        color: var(--color-text);
        font-size: var(--text-xs);
        transition: var(--transition-interactive);
      }

      .control-field select:focus-visible {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus-ring) 45%, transparent);
      }

      .assignee-row {
        display: flex;
        align-items: center;
        gap: var(--space-2);
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
        font-size: var(--text-xs);
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
