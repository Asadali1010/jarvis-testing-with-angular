import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { UserStats } from '../../core/models/user.model';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';
import {
  formatSystemStatus,
  systemStatusLabel,
} from '../../core/utils/user-display.util';
import { StatTrendDirection } from './components/stat-card/stat-card.component';
import { ActivityTimelineComponent } from './components/activity-timeline/activity-timeline.component';
import { DashboardWidgetComponent } from './components/dashboard-widget/dashboard-widget.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';

interface StatTrend {
  label: string;
  direction: StatTrendDirection;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    StatCardComponent,
    ActivityTimelineComponent,
    QuickActionsComponent,
    DashboardWidgetComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly activityService = inject(ActivityService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly stats = this.userService.stats;
  readonly activitiesLoading = this.activityService.isLoading;
  readonly activities = computed(() => this.activityService.activities().slice(0, 15));

  readonly now = signal(new Date());

  readonly formatSystemStatus = formatSystemStatus;
  readonly systemStatusLabel = systemStatusLabel;

  readonly profileUser = computed(() => this.profileService.getProfileForCurrentUser());

  readonly statTrends = computed(() => this.buildStatTrends(this.stats()));

  readonly greeting = computed(() => {
    const hour = this.now().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 17) {
      return 'Good afternoon';
    }
    return 'Good evening';
  });

  readonly displayName = computed(() => {
    const user = this.profileUser();
    if (user) {
      return user.firstName;
    }
    const email = this.currentUser()?.email;
    if (!email) {
      return 'there';
    }
    return email.split('@')[0] ?? 'there';
  });

  readonly quickSummary = computed(() => {
    const currentStats = this.stats();
    const activeLabel =
      currentStats.active === 1 ? 'active user' : 'active users';
    return `${currentStats.total} team members · ${currentStats.active} ${activeLabel} · ${formatSystemStatus(currentStats.systemStatus)}`;
  });

  readonly userOverview = computed(() => {
    const currentStats = this.stats();
    const total = currentStats.total || 1;
    const activePercent = Math.round((currentStats.active / total) * 100);
    const inactivePercent = 100 - activePercent;
    return { activePercent, inactivePercent, ...currentStats };
  });

  ngOnInit(): void {
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(new Date()));
  }

  private buildStatTrends(stats: UserStats): Record<
    'total' | 'active' | 'inactive' | 'newUsers' | 'systemStatus',
    StatTrend
  > {
    const total = stats.total || 1;
    const activePercent = Math.round((stats.active / total) * 100);

    return {
      total: {
        label: `${stats.total} registered`,
        direction: 'neutral',
      },
      active: {
        label: `${activePercent}% of team`,
        direction: stats.active > stats.inactive ? 'up' : 'neutral',
      },
      inactive: {
        label:
          stats.inactive === 0
            ? 'All users active'
            : `${stats.inactive} not active`,
        direction: stats.inactive > 0 ? 'down' : 'neutral',
      },
      newUsers: {
        label:
          stats.newUsers === 0
            ? 'None in last 30 days'
            : `${stats.newUsers} in last 30 days`,
        direction: stats.newUsers > 0 ? 'up' : 'neutral',
      },
      systemStatus: {
        label: formatSystemStatus(stats.systemStatus),
        direction: 'neutral',
      },
    };
  }

}
