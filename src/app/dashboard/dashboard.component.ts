import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  title = 'Executive Overview';
  userName = 'Alex';
  greeting = 'Welcome back,';

  metrics: MetricCard[] = [
    { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', isPositive: true, icon: 'bi-currency-dollar', color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Active Users', value: '2,350', change: '+180.1%', isPositive: true, icon: 'bi-people', color: 'text-blue-600 bg-blue-100' },
    { label: 'Sales', value: '+12,234', change: '+19%', isPositive: true, icon: 'bi-cart', color: 'text-purple-600 bg-purple-100' },
    { label: 'Churn Rate', value: '2.4%', change: '-4.1%', isPositive: false, icon: 'bi-graph-down', color: 'text-rose-600 bg-rose-100' },
  ];

  recentActivities: UserActivity[] = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'Administrator', status: 'Active', date: '2023-10-01' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', role: 'Editor', status: 'Active', date: '2023-10-02' },
    { id: 3, name: 'Michael Brown', email: 'michael@example.com', role: 'Viewer', status: 'Inactive', date: '2023-10-03' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Editor', status: 'Pending', date: '2023-10-04' },
    { id: 5, name: 'Chris Wilson', email: 'chris@example.com', role: 'Administrator', status: 'Active', date: '2023-10-05' },
    { id: 6, name: 'Jessica Taylor', email: 'jessica@example.com', role: 'Viewer', status: 'Active', date: '2023-10-06' },
  ];

  quickActions: QuickAction[] = [
    { label: 'Create Report', icon: 'bi-file-earmark-plus', color: 'text-blue-600 bg-blue-50', action: () => this.handleAction('Create Report') },
    { label: 'Add User', icon: 'bi-person-plus', color: 'text-emerald-600 bg-emerald-50', action: () => this.handleAction('Add User') },
    { label: 'Settings', icon: 'bi-gear', color: 'text-purple-600 bg-purple-50', action: () => this.handleAction('Settings') },
    { label: 'Support', icon: 'bi-headset', color: 'text-amber-600 bg-amber-50', action: () => this.handleAction('Support') },
  ];

  handleAction(actionName: string) {
    console.log(`Action triggered: ${actionName}`);
  }
}
