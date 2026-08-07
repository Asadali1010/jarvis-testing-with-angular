import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CreateTicketInput,
  TICKET_FIELD_LIMITS,
  Ticket,
  TicketDeleteResult,
  TicketMutationResult,
  TicketPriority,
  TicketStatus,
  UpdateTicketInput,
} from '../models/ticket.model';
import { UserService } from './user.service';

const TICKETS_STORAGE_KEY = 'app.tickets';

const SEED_TICKETS: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Set up onboarding checklist',
    description:
      'Draft and publish the first-run checklist for new team members.',
    status: 'open',
    priority: 'high',
    assigneeId: 'user-2',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-28T10:15:00.000Z',
  },
  {
    id: 'ticket-2',
    title: 'Review support queue metrics',
    description:
      'Audit weekly support volume and flag tickets breaching SLA targets.',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: 'user-5',
    createdAt: '2026-07-10T14:30:00.000Z',
    updatedAt: '2026-07-29T08:00:00.000Z',
  },
  {
    id: 'ticket-3',
    title: 'Archive inactive user accounts',
    description:
      'Identify inactive users from the last quarter and prepare deactivation list.',
    status: 'done',
    priority: 'low',
    assigneeId: 'user-1',
    createdAt: '2026-06-15T11:00:00.000Z',
    updatedAt: '2026-07-20T16:45:00.000Z',
  },
  {
    id: 'ticket-4',
    title: 'Plan Q3 marketing launch',
    description:
      'Coordinate campaign assets and launch timeline with the marketing team.',
    status: 'open',
    priority: 'urgent',
    assigneeId: null,
    createdAt: '2026-07-25T13:20:00.000Z',
    updatedAt: '2026-07-25T13:20:00.000Z',
  },
];

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userService = inject(UserService);

  private readonly ticketsState = signal<Ticket[]>(this.loadTickets());
  readonly error = signal<string | null>(null);

  readonly tickets = computed(() => this.ticketsState());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.persistTickets(this.ticketsState());
    }
  }

  getTicketById(id: string): Ticket | undefined {
    return this.ticketsState().find((ticket) => ticket.id === id);
  }

  createTicket(input: CreateTicketInput): TicketMutationResult {
    const validationError = this.validateTicketInput(input);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    if (input.assigneeId) {
      const assigneeError = this.validateAssignee(input.assigneeId);
      if (assigneeError) {
        this.error.set(assigneeError);
        return { success: false, error: assigneeError };
      }
    }

    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: this.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status ?? 'open',
      priority: input.priority ?? 'medium',
      assigneeId: input.assigneeId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.ticketsState.update((current) => [...current, ticket]);
    this.persistTickets(this.ticketsState());
    this.error.set(null);

    return { success: true, ticket };
  }

  updateTicket(id: string, input: UpdateTicketInput): TicketMutationResult {
    const existing = this.getTicketById(id);
    if (!existing) {
      const message = 'Ticket not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const merged: CreateTicketInput = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      priority: input.priority ?? existing.priority,
      assigneeId:
        'assigneeId' in input ? (input.assigneeId ?? null) : existing.assigneeId,
    };

    const validationError = this.validateTicketInput(merged);
    if (validationError) {
      this.error.set(validationError);
      return { success: false, error: validationError };
    }

    if (merged.assigneeId) {
      const assigneeError = this.validateAssignee(merged.assigneeId);
      if (assigneeError) {
        this.error.set(assigneeError);
        return { success: false, error: assigneeError };
      }
    }

    const updated: Ticket = {
      ...existing,
      title: merged.title.trim(),
      description: merged.description.trim(),
      status: merged.status ?? 'open',
      priority: merged.priority ?? 'medium',
      assigneeId: merged.assigneeId ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.ticketsState.update((current) =>
      current.map((ticket) => (ticket.id === id ? updated : ticket)),
    );
    this.persistTickets(this.ticketsState());
    this.error.set(null);

    return { success: true, ticket: updated };
  }

  deleteTicket(id: string): TicketDeleteResult {
    const existing = this.getTicketById(id);
    if (!existing) {
      const message = 'Ticket not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    this.ticketsState.update((current) =>
      current.filter((ticket) => ticket.id !== id),
    );
    this.persistTickets(this.ticketsState());
    this.error.set(null);

    return { success: true, affected: 1 };
  }

  assignTicket(id: string, assigneeId: string): TicketMutationResult {
    const existing = this.getTicketById(id);
    if (!existing) {
      const message = 'Ticket not found.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const trimmedAssigneeId = assigneeId.trim();
    if (!trimmedAssigneeId) {
      const message = 'Assignee is required.';
      this.error.set(message);
      return { success: false, error: message };
    }

    const assigneeError = this.validateAssignee(trimmedAssigneeId);
    if (assigneeError) {
      this.error.set(assigneeError);
      return { success: false, error: assigneeError };
    }

    const updated: Ticket = {
      ...existing,
      assigneeId: trimmedAssigneeId,
      updatedAt: new Date().toISOString(),
    };

    this.ticketsState.update((current) =>
      current.map((ticket) => (ticket.id === id ? updated : ticket)),
    );
    this.persistTickets(this.ticketsState());
    this.error.set(null);

    return { success: true, ticket: updated };
  }

  private validateTicketInput(input: CreateTicketInput): string | null {
    if (!input.title?.trim()) {
      return 'Title is required.';
    }

    if (input.title.trim().length > TICKET_FIELD_LIMITS.title) {
      return `Title must be ${TICKET_FIELD_LIMITS.title} characters or fewer.`;
    }

    if (!input.description?.trim()) {
      return 'Description is required.';
    }

    if (input.description.trim().length > TICKET_FIELD_LIMITS.description) {
      return `Description must be ${TICKET_FIELD_LIMITS.description} characters or fewer.`;
    }

    if (input.status && !this.isValidStatus(input.status)) {
      return 'Status must be open, in-progress, or done.';
    }

    if (input.priority && !this.isValidPriority(input.priority)) {
      return 'Priority must be low, medium, high, or urgent.';
    }

    return null;
  }

  private validateAssignee(assigneeId: string): string | null {
    if (!this.userService.getUserById(assigneeId)) {
      return 'Assignee not found.';
    }

    return null;
  }

  private isValidStatus(status: TicketStatus): boolean {
    return status === 'open' || status === 'in-progress' || status === 'done';
  }

  private isValidPriority(priority: TicketPriority): boolean {
    return (
      priority === 'low' ||
      priority === 'medium' ||
      priority === 'high' ||
      priority === 'urgent'
    );
  }

  private loadTickets(): Ticket[] {
    if (!isPlatformBrowser(this.platformId)) {
      return structuredClone(SEED_TICKETS);
    }

    const stored = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!stored) {
      return structuredClone(SEED_TICKETS);
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return structuredClone(SEED_TICKETS);
      }

      return this.normalizeStoredTickets(parsed);
    } catch {
      return structuredClone(SEED_TICKETS);
    }
  }

  private normalizeStoredTickets(raw: unknown[]): Ticket[] {
    const seedById = new Map(SEED_TICKETS.map((ticket) => [ticket.id, ticket]));
    const normalized: Ticket[] = [];

    for (const item of raw) {
      const ticket = this.normalizeTicketRecord(item, seedById);
      if (ticket) {
        normalized.push(ticket);
      }
    }

    for (const seed of SEED_TICKETS) {
      if (!normalized.some((ticket) => ticket.id === seed.id)) {
        normalized.push(structuredClone(seed));
      }
    }

    return normalized;
  }

  private normalizeTicketRecord(
    raw: unknown,
    seedById: Map<string, Ticket>,
  ): Ticket | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Partial<Ticket>;
    const seed = record.id ? seedById.get(record.id) : undefined;
    const now = new Date().toISOString();
    const fallbackId = seed?.id ?? this.createId();

    const title = this.normalizeString(record.title, seed?.title ?? 'Untitled ticket');
    const description = this.normalizeString(
      record.description,
      seed?.description ?? 'No description provided.',
    );

    return {
      id: typeof record.id === 'string' && record.id.trim() ? record.id : fallbackId,
      title: this.truncate(title, TICKET_FIELD_LIMITS.title),
      description: this.truncate(description, TICKET_FIELD_LIMITS.description),
      status: this.normalizeStatus(record.status, seed?.status ?? 'open'),
      priority: this.normalizePriority(record.priority, seed?.priority ?? 'medium'),
      assigneeId:
        record.assigneeId === null
          ? null
          : typeof record.assigneeId === 'string' && record.assigneeId.trim()
            ? record.assigneeId.trim()
            : (seed?.assigneeId ?? null),
      createdAt:
        typeof record.createdAt === 'string' && record.createdAt
          ? record.createdAt
          : (seed?.createdAt ?? now),
      updatedAt:
        typeof record.updatedAt === 'string' && record.updatedAt
          ? record.updatedAt
          : (seed?.updatedAt ?? now),
    };
  }

  private normalizeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private normalizeStatus(value: unknown, fallback: TicketStatus): TicketStatus {
    return this.isValidStatus(value as TicketStatus)
      ? (value as TicketStatus)
      : fallback;
  }

  private normalizePriority(
    value: unknown,
    fallback: TicketPriority,
  ): TicketPriority {
    return this.isValidPriority(value as TicketPriority)
      ? (value as TicketPriority)
      : fallback;
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  private persistTickets(tickets: Ticket[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  }

  private createId(): string {
    return `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
