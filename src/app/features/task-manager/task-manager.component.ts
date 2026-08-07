import { LowerCasePipe } from '@angular/common';
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
  Ticket,
  TicketStatus,
} from '../../core/models/ticket.model';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { TicketCardComponent } from './components/ticket-card/ticket-card.component';
import { TicketFormComponent } from './components/ticket-form/ticket-form.component';

type StatusFilter = TicketStatus | 'all';

interface StatusColumn {
  status: TicketStatus;
  label: string;
}

@Component({
  selector: 'app-task-manager',
  imports: [
    LowerCasePipe,
    FormsModule,
    FocusTrapDirective,
    TicketCardComponent,
    TicketFormComponent,
  ],
  templateUrl: './task-manager.component.html',
  styleUrl: './task-manager.component.css',
})
export class TaskManagerComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = this.ticketService.error;
  readonly tickets = this.ticketService.tickets;

  readonly statusFilter = signal<StatusFilter>('all');
  readonly showCreateForm = signal(false);

  readonly statusColumns: StatusColumn[] = [
    { status: 'open', label: 'Open' },
    { status: 'in-progress', label: 'In progress' },
    { status: 'done', label: 'Done' },
  ];

  readonly statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];

  readonly activeUsers = computed(() =>
    this.userService.users().filter((user) => user.status === 'active'),
  );

  readonly isEmpty = computed(() => this.tickets().length === 0);

  readonly filteredTickets = computed(() => {
    const filter = this.statusFilter();
    const all = this.tickets();
    if (filter === 'all') {
      return all;
    }
    return all.filter((ticket) => ticket.status === filter);
  });

  readonly hasNoFilterResults = computed(
    () => !this.isEmpty() && this.filteredTickets().length === 0,
  );

  readonly visibleColumns = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'all') {
      return this.statusColumns;
    }
    return this.statusColumns.filter((column) => column.status === filter);
  });

  ticketsForStatus(status: TicketStatus): Ticket[] {
    return this.filteredTickets().filter((ticket) => ticket.status === status);
  }

  ticketCountForStatus(status: TicketStatus): number {
    return this.ticketsForStatus(status).length;
  }

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
    this.showCreateForm.set(true);
  }

  closeCreate(): void {
    this.showCreateForm.set(false);
  }

  onTicketCreated(_ticket: Ticket): void {
    this.closeCreate();
    this.error.set(null);
  }

  onStatusChange(ticketId: string, status: TicketStatus): void {
    const result = this.ticketService.updateTicket(ticketId, { status });
    if (!result.success) {
      return;
    }
    this.error.set(null);
  }

  onAssignChange(ticketId: string, assigneeId: string | null): void {
    if (assigneeId) {
      const result = this.ticketService.assignTicket(ticketId, assigneeId);
      if (!result.success) {
        return;
      }
    } else {
      const result = this.ticketService.updateTicket(ticketId, { assigneeId: null });
      if (!result.success) {
        return;
      }
    }
    this.error.set(null);
  }

  dismissError(): void {
    this.error.set(null);
  }
}
