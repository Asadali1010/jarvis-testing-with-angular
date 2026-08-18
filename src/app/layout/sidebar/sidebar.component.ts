import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { SidebarBehavior } from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';

interface NavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'task-manager' | 'users' | 'settings' | 'profile' | 'calculator' | 'faq' | 'construction-scheduler';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
  { label: 'Task Manager', route: '/task-manager', icon: 'task-manager' },
  { label: 'Users', route: '/users', icon: 'users' },
  { label: 'Calculator', route: '/calculator', icon: 'calculator' },
  { label: 'Construction Scheduler', route: '/construction-scheduler', icon: 'construction-scheduler' },
  { label: 'FAQ', route: '/faq', icon: 'faq' },
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
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly mobileOpen = input(false);
  readonly navigate = output<void>();

  readonly navItems = NAV_ITEMS;
  readonly appearance = this.settingsService.appearance;
  readonly profileUser = computed(() => this.profileService.getProfileForCurrentUser());

  readonly sidebarBehavior = computed(
    () => this.settingsService.appearance().sidebarBehavior,
  );

  readonly collapsed = computed(
    () => this.settingsService.appearance().sidebarBehavior === 'collapsed',
  );

  readonly hoverExpand = computed(
    () => this.settingsService.appearance().sidebarBehavior === 'hover',
  );

  readonly showCollapseToggle = computed(() => {
    const behavior = this.sidebarBehavior();
    return behavior === 'expanded' || behavior === 'collapsed';
  });

  toggleCollapsed(): void {
    const behavior = this.sidebarBehavior();
    if (behavior === 'hover') {
      return;
    }

    const next: SidebarBehavior = behavior === 'expanded' ? 'collapsed' : 'expanded';
    this.settingsService.updateAppearance({ sidebarBehavior: next });
  }

  onNavigate(): void {
    this.navigate.emit();
  }

  isCollapsedForDisplay(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return this.collapsed() && !this.hoverExpand();
  }
}
