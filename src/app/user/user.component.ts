import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserStats } from '../user/user.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  private userService = inject(UserService);

  users: User[] = [];
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
    this.userService.users$.subscribe(users => {
      this.users = users;
      this.applyFilters();
    });

    this.userService.getStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  addUser(): void {
    // This is a mock implementation of adding a user for now, 
    // as there is no form in the current HTML.
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New User',
      email: `new.${Math.floor(Math.random() * 1000)}@example.com`,
      department: 'Engineering',
      role: 'Viewer',
      status: 'Active',
      avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
      lastLogin: 'Never'
    };
    this.userService.addUser(newUser);
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
