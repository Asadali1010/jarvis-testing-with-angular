import { Injectable, computed, signal } from '@angular/core';

import {
  ActivityEvent,
  RecordActivityInput,
} from '../models/activity.model';

const MAX_ACTIVITIES = 100;

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly events = signal<ActivityEvent[]>([]);

  readonly activities = computed(() => this.events());
  readonly isLoading = signal(false);

  record(input: RecordActivityInput): ActivityEvent {
    const event: ActivityEvent = {
      id: this.createId(),
      type: input.type,
      title: input.title,
      description: input.description,
      timestamp: new Date().toISOString(),
      userId: input.userId,
      userName: input.userName,
      metadata: input.metadata,
    };

    this.events.update((current) => [event, ...current].slice(0, MAX_ACTIVITIES));
    return event;
  }

  recordLogin(userName: string, userId?: string): ActivityEvent {
    return this.record({
      type: 'login',
      title: 'User signed in',
      description: `${userName} signed in to the application.`,
      userId,
      userName,
    });
  }

  recordUserCreate(userName: string, userId: string): ActivityEvent {
    return this.record({
      type: 'user_create',
      title: 'User created',
      description: `${userName} was added to the system.`,
      userId,
      userName,
    });
  }

  recordUserUpdate(userName: string, userId: string): ActivityEvent {
    return this.record({
      type: 'user_update',
      title: 'User updated',
      description: `${userName}'s profile was updated.`,
      userId,
      userName,
    });
  }

  recordProfileChange(userName: string, userId?: string): ActivityEvent {
    return this.record({
      type: 'profile_change',
      title: 'Profile updated',
      description: `${userName} updated their profile information.`,
      userId,
      userName,
    });
  }

  recordSettingsChange(userName: string, userId?: string): ActivityEvent {
    return this.record({
      type: 'settings_change',
      title: 'Settings updated',
      description: `${userName} changed application settings.`,
      userId,
      userName,
    });
  }

  getRecent(limit = 20): ActivityEvent[] {
    return this.events().slice(0, limit);
  }

  clear(): void {
    this.events.set([]);
  }

  private createId(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
