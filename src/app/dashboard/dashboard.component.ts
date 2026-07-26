import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService, User } from '../user/user.service';
import { Subscription } from 'rxjs';
import { UploadDocumentsComponent } from '../components/ui/upload-documents/upload-documents.component';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

interface UserActivity {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UploadDocumentsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  title = 'Executive Overview';
  userName = 'Alex';
  greeting = 'Welcome back,';

  metrics: MetricCard[] = [
    { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', isPositive: true, icon: 'bi-currency-dollar', color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Active Users', value: '0', change: '+180.1%', isPositive: true, icon: 'bi-people', color: 'text-blue-600 bg-blue-100' },
    { label: 'Sales', value: '+12,234', change: '+19%', isPositive: true, icon: 'bi-cart', color: 'text-purple-600 bg-purple-100' },
    { label: 'Churn Rate', value: '2.4%', change: '-4.1%', isPositive: false, icon: 'bi-graph-down', color: 'text-rose-600 bg-rose-100' },
  ];

  recentActivities: UserActivity[] = [];
  showUploadModal = false;

  quickActions: QuickAction[] = [
    { label: 'Create Report', icon: 'bi-file-earmark-plus', color: 'text-blue-600 bg-blue-50', action: () => this.handleAction('Create Report') },
    { label: 'Add User', icon: 'bi-person-plus', color: 'text-emerald-600 bg-emerald-50', action: () => this.addUser() },
    { label: 'Settings', icon: 'bi-gear', color: 'text-purple-600 bg-purple-50', action: () => this.handleAction('Settings') },
    { label: 'Support', icon: 'bi-headset', color: 'text-amber-600 bg-amber-50', action: () => this.handleAction('Support') },
  ];

  private statsSubscription: Subscription = new Subscription();
  private usersSubscription: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.statsSubscription = this.userService.getStats().subscribe(stats => {
      const activeUsersMetric = this.metrics.find(m => m.label === 'Active Users');
      if (activeUsersMetric) {
        activeUsersMetric.value = stats.active.toString();
      }
    });

    this.usersSubscription = this.userService.users$.subscribe(users => {
      this.recentActivities = users.slice(0, 6).map(user => ({
        id: parseInt(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status as 'Active' | 'Inactive' | 'Pending',
        date: user.lastLogin
      }));
    });
  }

  ngOnDestroy(): void {
    this.statsSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
  }

  /** Sends the user to the Users page with the create-user form already open. */
  addUser(): void {
    this.userService.requestCreateUser();
    this.router.navigate(['/users']);
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  navigateToSupportTickets(): void {
    this.router.navigate(['/support-tickets']);
  }

  handleAction(action: string): void {
    switch (action) {
      case 'Settings':
        this.router.navigate(['/settings']);
        break;
      case 'Support':
        this.router.navigate(['/support-tickets']);
        break;
      case 'Create Report':
        this.router.navigate(['/analytics']);
        break;
    }
  }
}
