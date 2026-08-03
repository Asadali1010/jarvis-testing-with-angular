import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import { User } from '../../../../core/models/user.model';
import {
  formatUserRole,
  getUserInitials,
} from '../../../../core/utils/user-display.util';

@Component({
  selector: 'app-user-detail',
  imports: [DatePipe],
  template: `
    @if (user(); as u) {
      <div class="user-detail">
        <div class="user-detail-identity">
          <div class="user-detail-avatar" aria-hidden="true">
            @if (u.avatar) {
              <img [src]="u.avatar" [alt]="displayName() + ' avatar'" />
            } @else {
              <span class="user-detail-initials">{{ initials() }}</span>
            }
          </div>
          <div>
            <h3 class="user-detail-name">{{ displayName() }}</h3>
            <p class="user-detail-role">{{ roleLabel() }}</p>
            <span class="status-badge" [class.status-active]="u.status === 'active'" [class.status-inactive]="u.status === 'inactive'">
              {{ u.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <dl class="user-detail-fields">
          <div>
            <dt>Email</dt>
            <dd>{{ u.email }}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{{ u.phone }}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{{ u.department }}</dd>
          </div>
          <div>
            <dt>Company</dt>
            <dd>{{ u.company ?? '—' }}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>
              <time [attr.datetime]="u.createdAt">{{ u.createdAt | date: 'medium' }}</time>
            </dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>
              <time [attr.datetime]="u.updatedAt">{{ u.updatedAt | date: 'medium' }}</time>
            </dd>
          </div>
          @if (u.bio) {
            <div class="user-detail-bio">
              <dt>Bio</dt>
              <dd>{{ u.bio }}</dd>
            </div>
          }
        </dl>

        <div class="user-detail-actions">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()">Close</button>
          <button type="button" class="btn btn-primary" (click)="editRequested.emit(u)">
            Edit user
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .user-detail-identity {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--color-border);
      }

      .user-detail-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 4rem;
        height: 4rem;
        border-radius: var(--radius-lg);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-muted)),
          var(--color-bg-muted)
        );
        overflow: hidden;
      }

      .user-detail-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-detail-initials {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-primary);
      }

      .user-detail-name {
        margin: 0 0 0.25rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-text);
      }

      .user-detail-role {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        color: var(--color-text-muted);
      }

      .status-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .status-active {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }

      .status-inactive {
        background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
        color: var(--color-text-muted);
      }

      .user-detail-fields {
        margin: 0 0 1.5rem;
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 480px) {
        .user-detail-fields {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .user-detail-bio {
          grid-column: 1 / -1;
        }
      }

      .user-detail-fields dt {
        margin: 0 0 0.25rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .user-detail-fields dd {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--color-text);
      }

      .user-detail-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--color-primary);
        color: var(--color-primary-contrast);
      }

      .btn-secondary {
        background: var(--color-bg-muted);
        border-color: var(--color-border);
        color: var(--color-text);
      }

      .btn:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }
    `,
  ],
})
export class UserDetailComponent {
  readonly user = input<User | null>(null);

  readonly closed = output<void>();
  readonly editRequested = output<User>();

  readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  readonly initials = computed(() => getUserInitials(this.user()));

  readonly roleLabel = computed(() => formatUserRole(this.user()?.role));
}
