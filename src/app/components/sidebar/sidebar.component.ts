import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  isCollapsed = false;

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/users', label: 'Users', icon: 'bi-people' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
    { path: '/profile', label: 'Profile', icon: 'bi-person' },
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
