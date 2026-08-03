import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  formatUserDisplayName,
  getUserInitials,
} from '../../core/utils/user-display.util';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  settings: 'Settings',
  profile: 'Profile',
};

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly menuToggle = output<void>();
  readonly userMenuOpen = signal(false);
  readonly isDark = this.themeService.isDark;
  readonly currentUser = this.authService.currentUser;
  readonly profileUser = computed(() => this.profileService.getProfileForCurrentUser());
  readonly formatUserDisplayName = formatUserDisplayName;
  readonly getUserInitials = getUserInitials;

  readonly avatarFallback = computed(() => {
    const email = this.currentUser()?.email;
    return email ? email.charAt(0).toUpperCase() : 'U';
  });

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.resolvePageTitle()),
      startWith(this.resolvePageTitle()),
    ),
    { initialValue: 'Dashboard' },
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.userMenuOpen()) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private resolvePageTitle(): string {
    const segments = this.router.url.split('/').filter(Boolean);
    const segment = segments[0] ?? 'dashboard';
    return PAGE_TITLES[segment] ?? 'Dashboard';
  }
}
