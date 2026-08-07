export type TicketStatus = 'open' | 'in-progress' | 'done';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export type UpdateTicketInput = Partial<CreateTicketInput>;

export type TicketMutationResult =
  | { success: true; ticket: Ticket }
  | { success: false; error: string };

export type TicketDeleteResult =
  | { success: true; affected: number }
  | { success: false; error: string };

/** Maximum lengths for ticket fields. */
export const TICKET_FIELD_LIMITS = {
  title: 120,
  description: 2000,
} as const;
