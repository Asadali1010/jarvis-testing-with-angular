import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

const SIDEBAR_STORAGE_KEY = 'app.sidebar.collapsed';

interface NavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'users' | 'settings' | 'profile';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
  { label: 'Users', route: '/users', icon: 'users' },
  { label: 'Settings', route: '/settings', icon: 'settings' },
  { label: 'Profile', route: '/profile', icon: 'profile' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly mobileOpen = input(false);
  readonly navigate = output<void>();

  readonly navItems = NAV_ITEMS;
  readonly collapsed = signal(this.readCollapsedState());

  toggleCollapsed(): void {
    this.collapsed.update((value) => {
      const next = !value;
      this.persistCollapsedState(next);
      return next;
    });
  }

  onNavigate(): void {
    this.navigate.emit();
  }

  private readCollapsedState(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  }

  private persistCollapsedState(collapsed: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }
}
