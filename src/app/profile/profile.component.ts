import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Profile {
  name: string;
  email: string;
  department: string;
  role: 'Admin' | 'Editor' | 'Viewer' | 'Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  memberSince: string;
  lastLogin: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  profile: Profile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
    role: 'Admin',
    status: 'Active',
    phone: '+1 (555) 014-8827',
    location: 'San Francisco, CA',
    bio: 'Platform engineer focused on internal tooling and developer experience.',
    avatar: 'https://i.pravatar.cc/150?u=john',
    memberSince: '2021-03-14',
    lastLogin: '2023-10-26 09:42',
  };

  /** Working copy so edits can be discarded on cancel. */
  form: Profile = { ...this.profile };

  departments: string[] = ['Engineering', 'Marketing', 'Sales', 'HR'];
  roles: Profile['role'][] = ['Admin', 'Editor', 'Viewer', 'Manager'];

  isEditing = false;

  startEditing(): void {
    this.form = { ...this.profile };
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.form = { ...this.profile };
    this.isEditing = false;
  }

  save(): void {
    this.profile = { ...this.form };
    this.isEditing = false;
  }
}
