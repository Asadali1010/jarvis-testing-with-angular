import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItem } from '../../../analytics/analytics.models';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-activity.component.html',
})
export class RecentActivityComponent {
  @Input() activities: ActivityItem[] = [];
  @Input() loading = false;
  @Input() title = 'Recent Activity';
  @Input() emptyMessage = 'No recent activity matches your current filters.';

  @Output() activityClick = new EventEmitter<ActivityItem>();

  getTypeClass(type: ActivityItem['type']): string {
    const classes: Record<ActivityItem['type'], string> = {
      revenue: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
      users: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
      traffic: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30',
      conversions: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30',
    };
    return classes[type];
  }

  onActivityClick(activity: ActivityItem): void {
    this.activityClick.emit(activity);
  }
}
