import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CreateConstructionJobInput } from '../models/construction-job.model';
import { ConstructionSchedulerService } from './construction-scheduler.service';

const JOBS_STORAGE_KEY = 'app.construction-jobs';

describe('ConstructionSchedulerService', () => {
  let service: ConstructionSchedulerService;
  let storage: Record<string, string>;

  const validJob: CreateConstructionJobInput = {
    name: 'Drywall install — Unit 12',
    site: 'Riverside Tower, 1200 Harbor Blvd',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    status: 'scheduled',
    crewIds: ['user-2', 'user-4'],
  };

  beforeEach(() => {
    storage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    });

    TestBed.configureTestingModule({
      providers: [
        ConstructionSchedulerService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ConstructionSchedulerService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes seeded jobs on first load', () => {
    expect(service.jobs().length).toBeGreaterThan(0);
    expect(service.getJobById('job-1')).toEqual(
      expect.objectContaining({
        name: 'Foundation pour — Block A',
        status: 'scheduled',
      }),
    );
  });

  it('creates a job and persists it to localStorage', () => {
    const result = service.createJob(validJob);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.job.name).toBe('Drywall install — Unit 12');
      expect(service.getJobById(result.job.id)).toEqual(result.job);
    }

    const stored = JSON.parse(storage[JOBS_STORAGE_KEY] ?? '[]');
    expect(
      stored.some(
        (job: { name: string }) => job.name === 'Drywall install — Unit 12',
      ),
    ).toBe(true);
  });

  it('validates required job fields', () => {
    expect(service.createJob({ ...validJob, name: '  ' })).toEqual({
      success: false,
      error: 'Name is required.',
    });
    expect(service.createJob({ ...validJob, site: '  ' })).toEqual({
      success: false,
      error: 'Site is required.',
    });
    expect(service.createJob({ ...validJob, startDate: '  ' })).toEqual({
      success: false,
      error: 'Start date is required.',
    });
    expect(service.createJob({ ...validJob, endDate: '  ' })).toEqual({
      success: false,
      error: 'End date is required.',
    });
  });

  it('rejects end dates before start dates', () => {
    expect(
      service.createJob({
        ...validJob,
        startDate: '2026-09-15',
        endDate: '2026-09-01',
      }),
    ).toEqual({
      success: false,
      error: 'End date must be on or after start date.',
    });
  });

  it('updates and deletes jobs', () => {
    const created = service.createJob(validJob);
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }

    const updated = service.updateJob(created.job.id, {
      status: 'in-progress',
      endDate: '2026-09-20',
    });

    expect(updated.success).toBe(true);
    if (updated.success) {
      expect(updated.job.status).toBe('in-progress');
      expect(updated.job.endDate).toBe('2026-09-20');
    }

    const deleted = service.deleteJob(created.job.id);
    expect(deleted).toEqual({ success: true, affected: 1 });
    expect(service.getJobById(created.job.id)).toBeUndefined();
  });

  it('reports errors when updating or deleting missing jobs', () => {
    expect(service.updateJob('missing-job', { name: 'Nope' })).toEqual({
      success: false,
      error: 'Construction job not found.',
    });
    expect(service.deleteJob('missing-job')).toEqual({
      success: false,
      error: 'Construction job not found.',
    });
  });

  it('rejects input that exceeds CONSTRUCTION_JOB_FIELD_LIMITS', () => {
    expect(
      service.createJob({
        ...validJob,
        name: 'x'.repeat(121),
      }),
    ).toEqual({
      success: false,
      error: 'Name must be 120 characters or fewer.',
    });

    expect(
      service.createJob({
        ...validJob,
        site: 'x'.repeat(201),
      }),
    ).toEqual({
      success: false,
      error: 'Site must be 200 characters or fewer.',
    });
  });

  it('loads persisted jobs after service re-instantiation', () => {
    service.createJob(validJob);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ConstructionSchedulerService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const reloaded = TestBed.inject(ConstructionSchedulerService);

    expect(
      reloaded
        .jobs()
        .some((job) => job.name === 'Drywall install — Unit 12'),
    ).toBe(true);
  });

  it('returns seed jobs when running on the server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ConstructionSchedulerService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const serverService = TestBed.inject(ConstructionSchedulerService);

    expect(serverService.jobs().length).toBeGreaterThan(0);
    expect(storage[JOBS_STORAGE_KEY]).toBeUndefined();
  });
});
