import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  TICKET_FIELD_LIMITS,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../../../core/models/ticket.model';
import { User } from '../../../../core/models/user.model';
import { TicketService } from '../../../../core/services/ticket.service';
import { formatUserDisplayName } from '../../../../core/utils/user-display.util';

@Component({
  selector: 'app-ticket-form',
  imports: [ReactiveFormsModule],
  templateUrl: './ticket-form.component.html',
  styles: [
    `
      .ticket-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .form-field label {
        display: block;
        margin-bottom: var(--space-2);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text);
      }

      .optional {
        font-weight: 400;
        color: var(--color-text-muted);
      }

      .form-field input,
      .form-field select,
      .form-field textarea {
        width: 100%;
        min-height: 2.75rem;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: var(--text-sm);
        font-family: inherit;
        transition: var(--transition-interactive);
      }

      .form-field textarea {
        min-height: 6rem;
        resize: vertical;
      }

      .form-field input:focus-visible,
      .form-field select:focus-visible,
      .form-field textarea:focus-visible {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus-ring) 45%, transparent);
      }

      .field-error,
      .form-error {
        margin: var(--space-2) 0 0;
        font-size: var(--text-xs);
        color: var(--color-danger);
      }

      .form-grid {
        display: grid;
        gap: var(--space-4);
      }

      @media (min-width: 640px) {
        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .form-field-full {
        grid-column: 1 / -1;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        padding-top: var(--space-2);
      }
    `,
  ],
})
export class TicketFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);

  readonly users = input<User[]>([]);

  readonly saved = output<Ticket>();
  readonly cancelled = output<void>();

  readonly serverError = signal<string | null>(null);
  readonly formatUserDisplayName = formatUserDisplayName;

  readonly statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];

  readonly priorityOptions: { value: TicketPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(TICKET_FIELD_LIMITS.title)]],
    description: [
      '',
      [Validators.required, Validators.maxLength(TICKET_FIELD_LIMITS.description)],
    ],
    status: ['open' as TicketStatus],
    priority: ['medium' as TicketPriority],
    assigneeId: [''],
  });

  showError(field: 'title' | 'description'): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  getError(field: 'title' | 'description'): string {
    const control = this.form.get(field);
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return field === 'title' ? 'Title is required.' : 'Description is required.';
    }

    if (control.errors['maxlength']) {
      const max =
        field === 'title'
          ? TICKET_FIELD_LIMITS.title
          : TICKET_FIELD_LIMITS.description;
      const label = field === 'title' ? 'Title' : 'Description';
      return `${label} must be ${max} characters or fewer.`;
    }

    return 'Enter a valid value.';
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const assigneeId = value.assigneeId.trim() ? value.assigneeId.trim() : null;

    const result = this.ticketService.createTicket({
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      assigneeId,
    });

    if (!result.success) {
      this.serverError.set(result.error);
      return;
    }

    this.submitted = false;
    this.form.reset({
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigneeId: '',
    });
    this.saved.emit(result.ticket);
  }
}
