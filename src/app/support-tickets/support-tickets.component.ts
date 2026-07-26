import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdAt: Date;
  category?: string;
  description?: string;
}

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './support-tickets.component.html',
  styleUrls: ['./support-tickets.component.css']
})
export class SupportTicketsComponent implements OnInit {
  readonly tickets = signal<SupportTicket[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly filteredTickets = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.tickets();
    }
    return this.tickets().filter(ticket =>
      ticket.subject.toLowerCase().includes(term) ||
      ticket.user.toLowerCase().includes(term) ||
      ticket.id.toLowerCase().includes(term)
    );
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredTickets().length / this.pageSize));

  readonly paginatedTickets = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTickets().slice(startIndex, startIndex + this.pageSize);
  });

  /** 1-based index of the first row on the current page, for the "Showing X to Y" label. */
  readonly rangeStart = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredTickets().length)
  );

  // Modal state
  readonly isModalOpen = signal(false);
  ticketForm: FormGroup;

  categories = ['Technical', 'Billing', 'Account', 'General', 'Feature Request'];
  priorities: SupportTicket['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
  statuses: SupportTicket['status'][] = ['Open', 'In Progress', 'Resolved', 'Closed'];

  constructor(private fb: FormBuilder) {
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required]],
      category: ['', [Validators.required]],
      priority: ['Medium', [Validators.required]],
      description: ['', [Validators.required]],
      status: ['Open', [Validators.required]],
      user: ['Current User'] // Simplified for demo
    });
  }

  ngOnInit(): void {
    this.fetchTickets();
  }

  fetchTickets(): void {
    this.isLoading.set(true);
    // Simulating API call
    setTimeout(() => {
      const mockTickets: SupportTicket[] = Array.from({ length: 25 }, (_, i) => ({
        id: `TICKET-${1000 + i}`,
        user: `User ${i + 1}`,
        subject: `Issue with ${['Login', 'Payment', 'Dashboard', 'API', 'Performance'][i % 5]} ${i + 1}`,
        status: ['Open', 'In Progress', 'Resolved', 'Closed'][i % 4] as any,
        priority: ['Low', 'Medium', 'High', 'Urgent'][i % 4] as any,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
      }));

      this.tickets.set(mockTickets);
      this.currentPage.set(1);
      this.isLoading.set(false);
    }, 800);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'In Progress': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Resolved': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Closed': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  deleteTicket(id: string): void {
    const confirmed = window.confirm(`Are you sure you want to delete ticket ${id}? This action cannot be undone.`);
    if (confirmed) {
      this.tickets.update(tickets => tickets.filter(ticket => ticket.id !== id));
      this.currentPage.set(1);
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Urgent': return 'text-rose-600 dark:text-rose-400 font-bold';
      case 'High': return 'text-orange-600 dark:text-orange-400 font-semibold';
      case 'Medium': return 'text-amber-600 dark:text-amber-400';
      case 'Low': return 'text-slate-600 dark:text-slate-400';
      default: return 'text-gray-600';
    }
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.ticketForm.reset({
      priority: 'Medium',
      status: 'Open',
      user: 'Current User'
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      const formValue = this.ticketForm.value;
      const newTicket: SupportTicket = {
        id: `TICKET-${1000 + this.tickets().length}`,
        user: formValue.user,
        subject: formValue.subject,
        status: formValue.status as any,
        priority: formValue.priority as any,
        category: formValue.category,
        description: formValue.description,
        createdAt: new Date(),
      };

      this.tickets.update(tickets => [newTicket, ...tickets]);
      this.currentPage.set(1);
      this.closeModal();
    } else {
      this.ticketForm.markAllAsTouched();
    }
  }
}
