import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickAction {
  label: string;
  description: string;
  route: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-quick-actions',
  imports: [RouterLink],
  template: `
    <nav class="quick-actions glass-panel" aria-label="Quick actions">
      <h3 class="quick-actions-heading">Quick Actions</h3>
      <ul class="quick-actions-list">
        @for (action of actions; track action.label) {
          <li>
            <a
              class="quick-action-link"
              [routerLink]="action.route"
              [attr.aria-label]="action.ariaLabel"
            >
              <span class="quick-action-label">{{ action.label }}</span>
              <span class="quick-action-description">{{ action.description }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [
    `
      .quick-actions {
        padding: var(--space-8);
        border-radius: var(--radius-card);
      }

      .quick-actions-heading {
        margin: 0 0 var(--space-6);
        font-family: var(--font-display);
        font-size: var(--text-lg);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        color: var(--color-text);
      }

      .quick-actions-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--space-4);
      }

      @media (min-width: 640px) {
        .quick-actions-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .quick-action-link {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-height: 2.75rem;
        padding: var(--space-5);
        border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
        border-radius: var(--radius-card);
        background: color-mix(in srgb, var(--color-bg-elevated) 88%, transparent);
        text-decoration: none;
        color: inherit;
        box-shadow: var(--shadow-sm);
        transition: var(--transition-interactive);
      }

      .quick-action-link:hover {
        border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
        background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg-elevated));
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .quick-action-link:hover .quick-action-label {
        color: var(--color-primary);
      }

      .quick-action-link:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }

      .quick-action-label {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text);
        transition: color var(--duration-fast) var(--ease-out);
      }

      .quick-action-description {
        font-size: var(--text-xs);
        line-height: var(--leading-relaxed);
        color: var(--color-text-muted);
      }

      @media (prefers-reduced-motion: reduce) {
        .quick-action-link:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class QuickActionsComponent {
  readonly actions: QuickAction[] = [
    {
      label: 'Create Ticket',
      description: 'Open a new support ticket',
      route: '/task-manager?action=create',
      ariaLabel: 'Create Ticket — open create ticket dialog',
    },
    {
      label: 'Add User',
      description: 'Create a new team member',
      route: '/users?action=add',
      ariaLabel: 'Add User — open add user dialog',
    },
    {
      label: 'View Users',
      description: 'Browse the full user directory',
      route: '/users',
      ariaLabel: 'View Users — navigate to user management',
    },
    {
      label: 'Edit Profile',
      description: 'Update your personal information',
      route: '/profile',
      ariaLabel: 'Edit Profile — navigate to your profile',
    },
    {
      label: 'Open Settings',
      description: 'Configure application preferences',
      route: '/settings',
      ariaLabel: 'Open Settings — navigate to settings',
    },
  ];
}
