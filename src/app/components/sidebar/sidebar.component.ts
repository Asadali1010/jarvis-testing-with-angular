import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = false;

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/analytics', label: 'Analytics', icon: 'bi-graph-up' },
    { path: '/users', label: 'Users', icon: 'bi-people' },
    { path: '/projects', label: 'Projects', icon: 'bi-kanban' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ];

  /** Matches the identity shown in the header and on the profile page. */
  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://i.pravatar.cc/150?u=john',
  };

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
