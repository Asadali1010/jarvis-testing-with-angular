import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConstructionJob } from '../../core/models/construction-job.model';
import { ActivityService } from '../../core/services/activity.service';
import { ConstructionSchedulerService } from '../../core/services/construction-scheduler.service';
import { UserService } from '../../core/services/user.service';
import { ConstructionSchedulerComponent } from './construction-scheduler.component';

describe('ConstructionSchedulerComponent', () => {
  let fixture: ComponentFixture<ConstructionSchedulerComponent>;
  let component: ConstructionSchedulerComponent;
  let schedulerService: ConstructionSchedulerService;
  let storage: Record<string, string>;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [ConstructionSchedulerComponent],
      providers: [
        ConstructionSchedulerService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    schedulerService = TestBed.inject(ConstructionSchedulerService);
    fixture = TestBed.createComponent(ConstructionSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('render', () => {
    it('renders header copy and timeline region when jobs exist', () => {
      const heading = fixture.nativeElement.querySelector(
        '#construction-scheduler-heading',
      );
      expect(heading?.textContent?.trim()).toBe('Construction Scheduler');

      const timeline = fixture.nativeElement.querySelector(
        '[aria-label="Construction job timeline"]',
      );
      expect(timeline).toBeTruthy();

      const filter = fixture.nativeElement.querySelector('#job-status-filter');
      expect(filter).toBeTruthy();
    });

    it('renders job cards with name, site, and status badge', () => {
      const cards = fixture.nativeElement.querySelectorAll('.job-card');
      expect(cards.length).toBeGreaterThan(0);

      const firstCard = cards[0] as HTMLElement;
      expect(firstCard.querySelector('.card-title')?.textContent?.trim()).toBeTruthy();
      expect(firstCard.querySelector('.card-site')?.textContent?.trim()).toBeTruthy();
      expect(firstCard.querySelector('.status-badge')?.textContent?.trim()).toBeTruthy();
    });
  });

  describe('create flow', () => {
    it('opens the job form modal and creates a job on submit', () => {
      const createButton = fixture.nativeElement.querySelector(
        '[aria-label="Create job"]',
      ) as HTMLButtonElement;
      createButton.click();
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('#create-job-title')?.textContent?.trim(),
      ).toBe('Create job');

      const createSpy = vi.spyOn(schedulerService, 'createJob').mockReturnValue({
        success: true,
        job: {
          id: 'job-new',
          name: 'Test framing',
          site: 'Test site',
          startDate: '2026-09-01',
          endDate: '2026-09-10',
          status: 'scheduled',
          crewIds: [],
        } satisfies ConstructionJob,
      });

      const nameInput = fixture.nativeElement.querySelector(
        '#job-name',
      ) as HTMLInputElement;
      const siteInput = fixture.nativeElement.querySelector(
        '#job-site',
      ) as HTMLInputElement;
      const startInput = fixture.nativeElement.querySelector(
        '#job-start-date',
      ) as HTMLInputElement;
      const endInput = fixture.nativeElement.querySelector(
        '#job-end-date',
      ) as HTMLInputElement;

      nameInput.value = 'Test framing';
      nameInput.dispatchEvent(new Event('input'));
      siteInput.value = 'Test site';
      siteInput.dispatchEvent(new Event('input'));
      startInput.value = '2026-09-01';
      startInput.dispatchEvent(new Event('input'));
      endInput.value = '2026-09-10';
      endInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      submitButton.click();
      fixture.detectChanges();

      expect(createSpy).toHaveBeenCalledOnce();
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test framing',
          site: 'Test site',
          startDate: '2026-09-01',
          endDate: '2026-09-10',
        }),
      );
      expect(component.showForm()).toBe(false);
    });
  });

  describe('filter behavior', () => {
    it('filters visible jobs by status and shows filtered-empty state', () => {
      component.onStatusFilterChange('scheduled');
      fixture.detectChanges();

      expect(component.filteredJobs().every((job) => job.status === 'scheduled')).toBe(
        true,
      );

      const scheduledCards = fixture.nativeElement.querySelectorAll('.job-card');
      expect(scheduledCards.length).toBe(component.filteredJobs().length);

      for (const job of [...schedulerService.jobs()]) {
        schedulerService.deleteJob(job.id);
      }
      schedulerService.createJob({
        name: 'Only in progress',
        site: 'Site A',
        startDate: '2026-08-01',
        endDate: '2026-08-15',
        status: 'in-progress',
        crewIds: [],
      });
      fixture.detectChanges();

      component.onStatusFilterChange('completed');
      fixture.detectChanges();

      expect(component.hasNoFilterResults()).toBe(true);
      const filteredEmpty = fixture.nativeElement.querySelector(
        '.scheduler-empty-filtered',
      );
      expect(filteredEmpty?.textContent).toContain(
        'No jobs match this status filter',
      );
    });
  });
});
