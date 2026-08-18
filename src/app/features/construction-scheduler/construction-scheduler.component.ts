import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FocusTrapDirective } from '../../core/directives/focus-trap.directive';
import {
  ConstructionJob,
  ConstructionJobStatus,
} from '../../core/models/construction-job.model';
import { ConstructionSchedulerService } from '../../core/services/construction-scheduler.service';
import { UserService } from '../../core/services/user.service';
import { JobCardComponent } from './components/job-card/job-card.component';
import { JobFormComponent } from './components/job-form/job-form.component';

type StatusFilter = ConstructionJobStatus | 'all';

interface TimelineBarLayout {
  job: ConstructionJob;
  leftPercent: number;
  widthPercent: number;
}

interface TimelineRange {
  startMs: number;
  endMs: number;
  startLabel: string;
  endLabel: string;
}

@Component({
  selector: 'app-construction-scheduler',
  imports: [
    DatePipe,
    FormsModule,
    FocusTrapDirective,
    JobCardComponent,
    JobFormComponent,
  ],
  templateUrl: './construction-scheduler.component.html',
  styleUrl: './construction-scheduler.component.css',
})
export class ConstructionSchedulerComponent implements OnInit {
  private readonly schedulerService = inject(ConstructionSchedulerService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = this.schedulerService.error;
  readonly jobs = this.schedulerService.jobs;

  readonly statusFilter = signal<StatusFilter>('all');
  readonly showForm = signal(false);
  readonly editingJob = signal<ConstructionJob | null>(null);

  readonly statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'completed', label: 'Completed' },
  ];

  readonly activeUsers = computed(() =>
    this.userService.users().filter((user) => user.status === 'active'),
  );

  readonly isEmpty = computed(() => this.jobs().length === 0);

  readonly filteredJobs = computed(() => {
    const filter = this.statusFilter();
    const all = this.jobs();
    if (filter === 'all') {
      return all;
    }
    return all.filter((job) => job.status === filter);
  });

  readonly hasNoFilterResults = computed(
    () => !this.isEmpty() && this.filteredJobs().length === 0,
  );

  readonly timelineRange = computed((): TimelineRange | null => {
    const jobs = this.filteredJobs();
    if (jobs.length === 0) {
      return null;
    }

    const startMs = Math.min(...jobs.map((job) => Date.parse(job.startDate)));
    const endMs = Math.max(...jobs.map((job) => Date.parse(job.endDate)));

    return {
      startMs,
      endMs,
      startLabel: this.formatDateLabel(startMs),
      endLabel: this.formatDateLabel(endMs),
    };
  });

  readonly timelineBars = computed((): TimelineBarLayout[] => {
    const range = this.timelineRange();
    if (!range) {
      return [];
    }

    const span = range.endMs - range.startMs || 1;

    return this.filteredJobs().map((job) => {
      const start = Date.parse(job.startDate);
      const end = Date.parse(job.endDate);
      const leftPercent = ((start - range.startMs) / span) * 100;
      const widthPercent = Math.max(((end - start) / span) * 100, 3);

      return { job, leftPercent, widthPercent };
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.get('action') === 'create') {
          this.openCreate();
        }
      });
  }

  onStatusFilterChange(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  openCreate(): void {
    this.editingJob.set(null);
    this.showForm.set(true);
  }

  openEdit(job: ConstructionJob): void {
    this.editingJob.set(job);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingJob.set(null);
  }

  onJobSaved(_job: ConstructionJob): void {
    this.closeForm();
    this.error.set(null);
  }

  onDelete(job: ConstructionJob): void {
    const result = this.schedulerService.deleteJob(job.id);
    if (!result.success) {
      return;
    }
    this.error.set(null);
  }

  dismissError(): void {
    this.error.set(null);
  }

  statusClass(status: ConstructionJobStatus): string {
    return `timeline-bar-${status}`;
  }

  private formatDateLabel(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
