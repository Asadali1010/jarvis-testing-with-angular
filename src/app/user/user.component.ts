import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Admin' | 'Editor' | 'Viewer' | 'Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  avatar: string;
  lastLogin: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  users: User[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', department: 'Engineering', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1', lastLogin: '2023-10-24 10:00' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Marketing', role: 'Editor', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2', lastLogin: '2023-10-25 14:30' },
    { id: '3', name: 'Michael Brown', email: 'michael.brown@example.com', department: 'Sales', role: 'Viewer', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=3', lastLogin: '2023-09-12 09:15' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@example.com', department: 'Engineering', role: 'Manager', status: 'Pending', avatar: 'https://i.pravatar.cc/150?u=4', lastLogin: 'Never' },
    { id: '5', name: 'Chris Wilson', email: 'chris.wilson@example.com', department: 'HR', role: 'Viewer', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=5', lastLogin: '2023-10-26 11:00' },
    { id: '6', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', department: 'Marketing', role: 'Editor', status: 'Pending', avatar: 'https://i.pravatar.cc/150?u=6', lastLogin: 'Never' },
  ];

  filteredUsers: User[] = [];
  stats: UserStats = { total: 0, active: 0, inactive: 0, pending: 0 };

  searchTerm: string = '';
  filterRole: string = 'All';
  filterStatus: string = 'All';
  filterDepartment: string = 'All';

  roles: string[] = ['All', 'Admin', 'Editor', 'Viewer', 'Manager'];
  statuses: string[] = ['All', 'Active', 'Inactive', 'Pending'];
  departments: string[] = ['All', 'Engineering', 'Marketing', 'Sales', 'HR'];

  ngOnInit(): void {
    this.updateStats();
    this.applyFilters();
  }

  updateStats(): void {
    this.stats = {
      total: this.users.length,
      active: this.users.filter(u => u.status === 'Active').length,
      inactive: this.users.filter(u => u.status === 'Inactive').length,
      pending: this.users.filter(u => u.status === 'Pending').length,
    };
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.filterRole === 'All' || user.role === this.filterRole;
      const matchesStatus = this.filterStatus === 'All' || user.status === this.filterStatus;
      const matchesDept = this.filterDepartment === 'All' || user.department === this.filterDepartment;

      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }
}
