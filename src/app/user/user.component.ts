import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserStats } from '../user/user.service';
import { UserFormComponent } from './user-form.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFormComponent],
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

  showUserForm = false;

  ngOnInit(): void {
    this.userService.users$.subscribe(users => {
      this.users = users;
      this.applyFilters();
    });

    this.userService.getStats().subscribe(stats => {
      this.stats = stats;
    });

    // Opened via the dashboard's "Add User" quick action.
    if (this.userService.consumeCreateUserRequest()) {
      this.showUserForm = true;
    }
  }

  openUserForm(): void {
    this.showUserForm = true;
  }

  closeUserForm(): void {
    this.showUserForm = false;
  }

  handleUserCreated(newUser: User): void {
    this.userService.addUser(newUser);
    this.closeUserForm();
    this.applyFilters();
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
