import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CreateTicketInput } from '../models/ticket.model';
import { ActivityService } from './activity.service';
import { TicketService } from './ticket.service';
import { UserService } from './user.service';

const TICKETS_STORAGE_KEY = 'app.tickets';

describe('TicketService', () => {
  let service: TicketService;
  let storage: Record<string, string>;

  const validTicket: CreateTicketInput = {
    title: 'Investigate login latency',
    description: 'Users report slow sign-in during peak hours.',
    priority: 'high',
    assigneeId: 'user-2',
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
        TicketService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(TicketService);
    TestBed.inject(ActivityService).clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes seeded tickets on first load', () => {
    expect(service.tickets().length).toBeGreaterThan(0);
    expect(service.getTicketById('ticket-1')).toEqual(
      expect.objectContaining({
        title: 'Set up onboarding checklist',
        status: 'open',
      }),
    );
  });

  it('creates a ticket and persists it to localStorage', () => {
    const result = service.createTicket(validTicket);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.ticket.title).toBe('Investigate login latency');
      expect(service.getTicketById(result.ticket.id)).toEqual(result.ticket);
    }

    const stored = JSON.parse(storage[TICKETS_STORAGE_KEY] ?? '[]');
    expect(stored.some((ticket: { title: string }) => ticket.title === 'Investigate login latency')).toBe(
      true,
    );
  });

  it('validates required ticket fields', () => {
    expect(service.createTicket({ ...validTicket, title: '  ' })).toEqual({
      success: false,
      error: 'Title is required.',
    });
    expect(service.createTicket({ ...validTicket, description: '  ' })).toEqual({
      success: false,
      error: 'Description is required.',
    });
  });

  it('rejects unknown assignees on create and assign', () => {
    expect(service.createTicket({ ...validTicket, assigneeId: 'missing-user' })).toEqual({
      success: false,
      error: 'Assignee not found.',
    });

    const created = service.createTicket({
      ...validTicket,
      assigneeId: null,
    });
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }

    expect(service.assignTicket(created.ticket.id, 'missing-user')).toEqual({
      success: false,
      error: 'Assignee not found.',
    });
  });

  it('updates and deletes tickets', () => {
    const created = service.createTicket(validTicket);
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }

    const updated = service.updateTicket(created.ticket.id, {
      status: 'in-progress',
      description: 'Profiled auth endpoints and added caching.',
    });

    expect(updated.success).toBe(true);
    if (updated.success) {
      expect(updated.ticket.status).toBe('in-progress');
      expect(updated.ticket.description).toBe(
        'Profiled auth endpoints and added caching.',
      );
    }

    const deleted = service.deleteTicket(created.ticket.id);
    expect(deleted).toEqual({ success: true, affected: 1 });
    expect(service.getTicketById(created.ticket.id)).toBeUndefined();
  });

  it('assigns a ticket to a valid user', () => {
    const created = service.createTicket({
      title: 'Unassigned backlog item',
      description: 'Needs an owner before work can start.',
      assigneeId: null,
    });
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }

    const assigned = service.assignTicket(created.ticket.id, 'user-4');

    expect(assigned.success).toBe(true);
    if (assigned.success) {
      expect(assigned.ticket.assigneeId).toBe('user-4');
      expect(service.getTicketById(created.ticket.id)?.assigneeId).toBe('user-4');
    }
  });

  it('rejects blank assignee ids', () => {
    expect(service.assignTicket('ticket-1', '   ')).toEqual({
      success: false,
      error: 'Assignee is required.',
    });
  });

  it('reports errors when updating or deleting missing tickets', () => {
    expect(service.updateTicket('missing-ticket', { title: 'Nope' })).toEqual({
      success: false,
      error: 'Ticket not found.',
    });
    expect(service.deleteTicket('missing-ticket')).toEqual({
      success: false,
      error: 'Ticket not found.',
    });
    expect(service.assignTicket('missing-ticket', 'user-1')).toEqual({
      success: false,
      error: 'Ticket not found.',
    });
  });

  it('rejects input that exceeds TICKET_FIELD_LIMITS', () => {
    expect(
      service.createTicket({
        ...validTicket,
        title: 'x'.repeat(121),
      }),
    ).toEqual({
      success: false,
      error: 'Title must be 120 characters or fewer.',
    });

    expect(
      service.createTicket({
        ...validTicket,
        description: 'x'.repeat(2001),
      }),
    ).toEqual({
      success: false,
      error: 'Description must be 2000 characters or fewer.',
    });
  });

  it('loads persisted tickets after service re-instantiation', () => {
    service.createTicket(validTicket);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TicketService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const reloaded = TestBed.inject(TicketService);

    expect(
      reloaded
        .tickets()
        .some((ticket) => ticket.title === 'Investigate login latency'),
    ).toBe(true);
  });

  it('normalizes corrupt localStorage records and restores seed tickets', async () => {
    storage[TICKETS_STORAGE_KEY] = JSON.stringify([
      {
        id: 'ticket-2',
        title: 'Review support queue metrics',
        description: 'Audit weekly support volume.',
        status: 'in-progress',
        priority: 'medium',
        assigneeId: 'user-5',
        createdAt: '2026-07-10T14:30:00.000Z',
        updatedAt: '2026-07-29T08:00:00.000Z',
      },
      { invalid: true },
    ]);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        TicketService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    const reloaded = TestBed.inject(TicketService);

    expect(reloaded.getTicketById('ticket-2')?.assigneeId).toBe('user-5');
    expect(reloaded.tickets().some((ticket) => ticket.id === 'ticket-1')).toBe(true);
  });

  it('returns seed tickets when running on the server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TicketService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const serverService = TestBed.inject(TicketService);

    expect(serverService.tickets().length).toBeGreaterThan(0);
    expect(storage[TICKETS_STORAGE_KEY]).toBeUndefined();
  });
});
