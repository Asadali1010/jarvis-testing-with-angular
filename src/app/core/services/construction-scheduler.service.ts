import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CONSTRUCTION_JOB_FIELD_LIMITS,
  ConstructionJob,
  ConstructionJobDeleteResult,
  ConstructionJobMutationResult,
  ConstructionJobStatus,
  CreateConstructionJobInput,
  UpdateConstructionJobInput,
} from '../models/construction-job.model';

const JOBS_STORAGE_KEY = 'app.construction-jobs';

const SEED_JOBS: ConstructionJob[] = [
  {
    id: 'job-1',
    name: 'Foundation pour — Block A',
    site: 'Riverside Tower, 1200 Harbor Blvd',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    status: 'scheduled',
    crewIds: ['user-2', 'user-4'],
  },
  {
    id: 'job-2',
    name: 'Steel framing — Level 3',
    site: 'Riverside Tower, 1200 Harbor Blvd',
    startDate: '2026-07-20',
    endDate: '2026-08-10',
    status: 'in-progress',
    crewIds: ['user-1', 'user-5'],
  },
  {
    id: 'job-3',
    name: 'Electrical rough-in',
    site: 'Oak Park Commons, 88 Maple St',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'completed',
    crewIds: ['user-3'],
  },
  {
    id: 'job-4',
    name: 'Roof membrane install',
    site: 'Oak Park Commons, 88 Maple St',
    startDate: '2026-07-01',
    endDate: '2026-07-25',
    status: 'delayed',
    crewIds: ['user-2', 'user-3', 'user-5'],
  },
];

@Injectable({ providedIn: 'root' })
export class ConstructionSchedulerService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly jobsState = signal<ConstructionJob[]>(this.loadJobs());
  readonly error = signal<string | null>(null);

  readonly jobs = computed(() => this.jobsState());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.persistJobs(this.jobsState());
    }
  }

  getJobById(id: string): ConstructionJob | undefined {
    return this.jobsState().find((job) => job.id === id);
  }

  createJob(input: CreateConstructionJobInput): ConstructionJobMutationResult {
    const validationError = this.validateJobInput(input);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    const job: ConstructionJob = {
      id: this.createId(),
      name: input.name.trim(),
      site: input.site.trim(),
      startDate: input.startDate.trim(),
      endDate: input.endDate.trim(),
      status: input.status ?? 'scheduled',
      crewIds: this.normalizeCrewIds(input.crewIds),
    };

    this.jobsState.update((current) => [...current, job]);
    this.persistJobs(this.jobsState());
    this.error.set(null);

    return { success: true, job };
  }

  updateJob(
    id: string,
    input: UpdateConstructionJobInput,
  ): ConstructionJobMutationResult {
    const existing = this.getJobById(id);
    if (!existing) {
      const message = 'Construction job not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const merged: CreateConstructionJobInput = {
      name: input.name ?? existing.name,
      site: input.site ?? existing.site,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      status: input.status ?? existing.status,
      crewIds: input.crewIds ?? existing.crewIds,
    };

    const validationError = this.validateJobInput(merged);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    const updated: ConstructionJob = {
      ...existing,
      name: merged.name.trim(),
      site: merged.site.trim(),
      startDate: merged.startDate.trim(),
      endDate: merged.endDate.trim(),
      status: merged.status ?? 'scheduled',
      crewIds: this.normalizeCrewIds(merged.crewIds),
    };

    this.jobsState.update((current) =>
      current.map((job) => (job.id === id ? updated : job)),
    );
    this.persistJobs(this.jobsState());
    this.error.set(null);

    return { success: true, job: updated };
  }

  deleteJob(id: string): ConstructionJobDeleteResult {
    const existing = this.getJobById(id);
    if (!existing) {
      const message = 'Construction job not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    this.jobsState.update((current) => current.filter((job) => job.id !== id));
    this.persistJobs(this.jobsState());
    this.error.set(null);

    return { success: true, affected: 1 };
  }

  private validateJobInput(input: CreateConstructionJobInput): string | null {
    if (!input.name?.trim()) {
      return 'Name is required.';
    }

    if (input.name.trim().length > CONSTRUCTION_JOB_FIELD_LIMITS.name) {
      return `Name must be ${CONSTRUCTION_JOB_FIELD_LIMITS.name} characters or fewer.`;
    }

    if (!input.site?.trim()) {
      return 'Site is required.';
    }

    if (input.site.trim().length > CONSTRUCTION_JOB_FIELD_LIMITS.site) {
      return `Site must be ${CONSTRUCTION_JOB_FIELD_LIMITS.site} characters or fewer.`;
    }

    if (!input.startDate?.trim()) {
      return 'Start date is required.';
    }

    if (!input.endDate?.trim()) {
      return 'End date is required.';
    }

    if (!this.isValidDateRange(input.startDate.trim(), input.endDate.trim())) {
      return 'End date must be on or after start date.';
    }

    if (input.status && !this.isValidStatus(input.status)) {
      return 'Status must be scheduled, in-progress, delayed, or completed.';
    }

    return null;
  }

  private isValidDateRange(startDate: string, endDate: string): boolean {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return false;
    }

    return end >= start;
  }

  private isValidStatus(status: ConstructionJobStatus): boolean {
    return (
      status === 'scheduled' ||
      status === 'in-progress' ||
      status === 'delayed' ||
      status === 'completed'
    );
  }

  private normalizeCrewIds(crewIds: string[] | undefined): string[] {
    if (!crewIds?.length) {
      return [];
    }

    return crewIds
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  private loadJobs(): ConstructionJob[] {
    if (!isPlatformBrowser(this.platformId)) {
      return structuredClone(SEED_JOBS);
    }

    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!stored) {
      return structuredClone(SEED_JOBS);
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return structuredClone(SEED_JOBS);
      }

      return this.normalizeStoredJobs(parsed);
    } catch {
      return structuredClone(SEED_JOBS);
    }
  }

  private normalizeStoredJobs(raw: unknown[]): ConstructionJob[] {
    const seedById = new Map(SEED_JOBS.map((job) => [job.id, job]));
    const normalized: ConstructionJob[] = [];

    for (const item of raw) {
      const job = this.normalizeJobRecord(item, seedById);
      if (job) {
        normalized.push(job);
      }
    }

    for (const seed of SEED_JOBS) {
      if (!normalized.some((job) => job.id === seed.id)) {
        normalized.push(structuredClone(seed));
      }
    }

    return normalized;
  }

  private normalizeJobRecord(
    raw: unknown,
    seedById: Map<string, ConstructionJob>,
  ): ConstructionJob | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Partial<ConstructionJob>;
    const seed = record.id ? seedById.get(record.id) : undefined;
    const fallbackId = seed?.id ?? this.createId();

    const name = this.normalizeString(record.name, seed?.name ?? 'Untitled job');
    const site = this.normalizeString(record.site, seed?.site ?? 'Unknown site');
    const startDate = this.normalizeString(
      record.startDate,
      seed?.startDate ?? '2026-01-01',
    );
    const endDate = this.normalizeString(
      record.endDate,
      seed?.endDate ?? '2026-01-31',
    );

    return {
      id: typeof record.id === 'string' && record.id.trim() ? record.id : fallbackId,
      name: this.truncate(name, CONSTRUCTION_JOB_FIELD_LIMITS.name),
      site: this.truncate(site, CONSTRUCTION_JOB_FIELD_LIMITS.site),
      startDate,
      endDate,
      status: this.normalizeStatus(record.status, seed?.status ?? 'scheduled'),
      crewIds: Array.isArray(record.crewIds)
        ? this.normalizeCrewIds(record.crewIds as string[])
        : (seed?.crewIds ?? []),
    };
  }

  private normalizeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private normalizeStatus(
    value: unknown,
    fallback: ConstructionJobStatus,
  ): ConstructionJobStatus {
    return this.isValidStatus(value as ConstructionJobStatus)
      ? (value as ConstructionJobStatus)
      : fallback;
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  private persistJobs(jobs: ConstructionJob[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  }

  private createId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
