import { Component, OnInit } from '@angular/core';
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
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  currentPage: number = 1;
  pageSize: number = 10;
  totalTickets: number = 0;

  // Modal state
  isModalOpen = false;
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
    this.isLoading = true;
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
      
      this.tickets = mockTickets;
      this.totalTickets = mockTickets.length;
      this.applyFilter();
      this.isLoading = false;
    }, 800);
  }

  applyFilter(): void {
    this.filteredTickets = this.tickets.filter(ticket => 
      ticket.subject.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
  }

  get paginatedTickets(): SupportTicket[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTickets.length / this.pageSize);
  }

  // Helper for template to access Math.min
  protected readonly Math = Math;

  goToPage(page: number): void {
    this.currentPage = page;
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
      this.tickets = this.tickets.filter(ticket => ticket.id !== id);
      this.totalTickets = this.tickets.length;
      this.applyFilter();
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
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
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
        id: `TICKET-${1000 + this.tickets.length}`,
        user: formValue.user,
        subject: formValue.subject,
        status: formValue.status as any,
        priority: formValue.priority as any,
        category: formValue.category,
        description: formValue.description,
        createdAt: new Date(),
      };

      this.tickets = [newTicket, ...this.tickets];
      this.totalTickets = this.tickets.length;
      this.applyFilter();
      this.closeModal();
    } else {
      this.ticketForm.markAllAsTouched();
    }
  }
}
