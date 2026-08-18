import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  CONSTRUCTION_JOB_FIELD_LIMITS,
  ConstructionJob,
  ConstructionJobStatus,
} from '../../../../core/models/construction-job.model';
import { User } from '../../../../core/models/user.model';
import { ConstructionSchedulerService } from '../../../../core/services/construction-scheduler.service';
import { formatUserDisplayName } from '../../../../core/utils/user-display.util';

function dateRangeValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if (!startDate || !endDate) {
    return null;
  }

  const start = Date.parse(startDate);
  const end = Date.parse(endDate);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return { dateRange: true };
  }

  return null;
}

@Component({
  selector: 'app-job-form',
  imports: [ReactiveFormsModule],
  templateUrl: './job-form.component.html',
  styles: [
    `
      .job-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .form-field label,
      .form-field legend {
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
      .form-field select {
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

      .form-field input:focus-visible,
      .form-field select:focus-visible {
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

      .crew-fieldset {
        margin: 0;
        padding: var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-elevated);
      }

      .crew-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .crew-option {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--color-text);
        cursor: pointer;
      }

      .crew-option input {
        width: auto;
        min-height: auto;
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
export class JobFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly schedulerService = inject(ConstructionSchedulerService);

  readonly job = input<ConstructionJob | null>(null);
  readonly users = input<User[]>([]);

  readonly saved = output<ConstructionJob>();
  readonly cancelled = output<void>();

  readonly serverError = signal<string | null>(null);
  readonly formatUserDisplayName = formatUserDisplayName;
  readonly selectedCrewIds = signal<string[]>([]);

  readonly statusOptions: { value: ConstructionJobStatus; label: string }[] = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'completed', label: 'Completed' },
  ];

  private submitted = false;

  readonly form = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(CONSTRUCTION_JOB_FIELD_LIMITS.name),
        ],
      ],
      site: [
        '',
        [
          Validators.required,
          Validators.maxLength(CONSTRUCTION_JOB_FIELD_LIMITS.site),
        ],
      ],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['scheduled' as ConstructionJobStatus],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    effect(() => {
      const editing = this.job();
      if (editing) {
        this.form.patchValue({
          name: editing.name,
          site: editing.site,
          startDate: editing.startDate,
          endDate: editing.endDate,
          status: editing.status,
        });
        this.selectedCrewIds.set([...editing.crewIds]);
      } else {
        this.resetForm();
      }
    });
  }

  isEditing(): boolean {
    return !!this.job();
  }

  isCrewSelected(userId: string): boolean {
    return this.selectedCrewIds().includes(userId);
  }

  toggleCrewMember(userId: string, checked: boolean): void {
    this.selectedCrewIds.update((current) => {
      if (checked) {
        return current.includes(userId) ? current : [...current, userId];
      }
      return current.filter((id) => id !== userId);
    });
  }

  showError(
    field: 'name' | 'site' | 'startDate' | 'endDate',
  ): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  showDateRangeError(): boolean {
    return (
      this.form.hasError('dateRange') &&
      (this.form.get('startDate')?.touched ||
        this.form.get('endDate')?.touched ||
        this.submitted)
    );
  }

  getError(field: 'name' | 'site' | 'startDate' | 'endDate'): string {
    const control = this.form.get(field);
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      switch (field) {
        case 'name':
          return 'Name is required.';
        case 'site':
          return 'Site is required.';
        case 'startDate':
          return 'Start date is required.';
        case 'endDate':
          return 'End date is required.';
      }
    }

    if (control.errors['maxlength']) {
      const max =
        field === 'name'
          ? CONSTRUCTION_JOB_FIELD_LIMITS.name
          : CONSTRUCTION_JOB_FIELD_LIMITS.site;
      const label = field === 'name' ? 'Name' : 'Site';
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
    const payload = {
      name: value.name,
      site: value.site,
      startDate: value.startDate,
      endDate: value.endDate,
      status: value.status,
      crewIds: this.selectedCrewIds(),
    };

    const editing = this.job();
    const result = editing
      ? this.schedulerService.updateJob(editing.id, payload)
      : this.schedulerService.createJob(payload);

    if (!result.success) {
      this.serverError.set(result.error);
      return;
    }

    this.submitted = false;
    this.resetForm();
    this.saved.emit(result.job);
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      site: '',
      startDate: '',
      endDate: '',
      status: 'scheduled',
    });
    this.selectedCrewIds.set([]);
  }
}
