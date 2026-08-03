import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  ActivityEvent,
  RecordActivityInput,
} from '../models/activity.model';

const ACTIVITIES_STORAGE_KEY = 'app.activities';
const MAX_ACTIVITIES = 100;

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly events = signal<ActivityEvent[]>(this.loadActivities());

  readonly activities = computed(() => this.events());
  readonly isLoading = signal(false);

  constructor() {
    effect(() => {
      this.persistActivities(this.events());
    });
  }

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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
    }
  }

  private loadActivities(): ActivityEvent[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as ActivityEvent[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ACTIVITIES) : [];
    } catch {
      return [];
    }
  }

  private persistActivities(events: ActivityEvent[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (events.length === 0) {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      ACTIVITIES_STORAGE_KEY,
      JSON.stringify(events.slice(0, MAX_ACTIVITIES)),
    );
  }

  private createId(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
