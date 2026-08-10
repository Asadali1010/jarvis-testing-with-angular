import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';

const NOTIFICATIONS_STORAGE_KEY = 'app.notifications';

describe('NotificationService', () => {
  let service: NotificationService;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(NotificationService);
    service.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('seeds a default notification when storage is empty', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);

    expect(fresh.notifications().length).toBeGreaterThanOrEqual(1);
    expect(fresh.notifications()[0]?.title).toBe('Welcome to Jarvis Enterprise');
    expect(fresh.notifications()[0]?.read).toBe(false);
  });

  it('starts empty after clear', () => {
    expect(service.notifications()).toEqual([]);
  });

  it('marks a notification as read', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    const id = fresh.notifications()[0]!.id;

    fresh.markAsRead(id);

    expect(fresh.notifications()[0]?.read).toBe(true);
  });

  it('leaves other notifications unchanged when marking one as read', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    const id = fresh.notifications()[0]!.id;

    fresh.markAsRead('non-existent-id');

    expect(fresh.notifications()[0]?.id).toBe(id);
    expect(fresh.notifications()[0]?.read).toBe(false);
  });

  it('clears all notifications', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    fresh.clear();

    expect(fresh.notifications()).toEqual([]);
  });

  it('persists notifications to localStorage under app.notifications', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    TestBed.flushEffects();

    const stored = JSON.parse(storage[NOTIFICATIONS_STORAGE_KEY] ?? '[]');

    expect(stored.length).toBeGreaterThanOrEqual(1);
    expect(stored[0]?.title).toBe('Welcome to Jarvis Enterprise');
  });

  it('loads persisted notifications after service re-instantiation', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    const id = fresh.notifications()[0]!.id;
    fresh.markAsRead(id);
    TestBed.flushEffects();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const reloaded = TestBed.inject(NotificationService);

    expect(reloaded.notifications()).toHaveLength(1);
    expect(reloaded.notifications()[0]?.read).toBe(true);
  });

  it('clear removes persisted notifications from localStorage', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fresh = TestBed.inject(NotificationService);
    TestBed.flushEffects();
    expect(storage[NOTIFICATIONS_STORAGE_KEY]).toBeDefined();

    fresh.clear();
    TestBed.flushEffects();

    expect(fresh.notifications()).toEqual([]);
    expect(storage[NOTIFICATIONS_STORAGE_KEY]).toBeUndefined();
  });
});
