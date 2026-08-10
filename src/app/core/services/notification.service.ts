import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { Notification } from '../models/notification.model';

const NOTIFICATIONS_STORAGE_KEY = 'app.notifications';
const MAX_NOTIFICATIONS = 100;

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notification-seed-welcome',
    title: 'Welcome to Jarvis Enterprise',
    message: 'Your workspace is ready. Explore the dashboard to get started.',
    timestamp: '2026-08-01T09:00:00.000Z',
    read: false,
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly items = signal<Notification[]>(this.loadNotifications());

  readonly notifications = computed(() => this.items());

  constructor() {
    effect(() => {
      this.persistNotifications(this.items());
    });
  }

  markAsRead(id: string): void {
    this.items.update((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  clear(): void {
    this.items.set([]);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }
  }

  private loadNotifications(): Notification[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!stored) {
      return [...SEED_NOTIFICATIONS];
    }

    try {
      const parsed = JSON.parse(stored) as Notification[];
      return Array.isArray(parsed)
        ? parsed.slice(0, MAX_NOTIFICATIONS)
        : [...SEED_NOTIFICATIONS];
    } catch {
      return [...SEED_NOTIFICATIONS];
    }
  }

  private persistNotifications(notifications: Notification[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (notifications.length === 0) {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
    );
  }
}
