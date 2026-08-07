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
    <nav class="quick-actions" aria-label="Quick actions">
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
      .quick-actions-heading {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .quick-actions-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }

      @media (min-width: 640px) {
        .quick-actions-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .quick-action-link {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-elevated);
        text-decoration: none;
        color: inherit;
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease,
          transform 0.2s ease;
      }

      .quick-action-link:hover {
        border-color: var(--color-primary);
        background: var(--color-bg-muted);
        transform: translateY(-1px);
      }

      .quick-action-link:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }

      .quick-action-label {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .quick-action-description {
        font-size: 0.8125rem;
        color: var(--color-text-muted);
      }

      @media (prefers-reduced-motion: reduce) {
        .quick-action-link {
          transition: none;
        }

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
