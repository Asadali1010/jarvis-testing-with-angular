import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ActivityService } from './activity.service';

const ACTIVITIES_STORAGE_KEY = 'app.activities';

describe('ActivityService', () => {
  let service: ActivityService;
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
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ActivityService);
    service.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with an empty activity timeline', () => {
    expect(service.activities()).toEqual([]);
  });

  it('records login events with timestamps', () => {
    const event = service.recordLogin('Alex Johnson', 'user-1');

    expect(event.type).toBe('login');
    expect(event.title).toBe('User signed in');
    expect(event.userName).toBe('Alex Johnson');
    expect(event.userId).toBe('user-1');
    expect(new Date(event.timestamp).toString()).not.toBe('Invalid Date');
    expect(service.activities()).toHaveLength(1);
  });

  it('records user create, update, profile, and settings events', () => {
    service.recordUserCreate('Maria Chen', 'user-2');
    service.recordUserUpdate('Maria Chen', 'user-2');
    service.recordProfileChange('Alex Johnson', 'user-1');
    service.recordSettingsChange('Alex Johnson', 'user-1');

    const types = service.activities().map((event) => event.type);

    expect(types).toEqual([
      'settings_change',
      'profile_change',
      'user_update',
      'user_create',
    ]);
  });

  it('returns recent activities in newest-first order', () => {
    service.recordLogin('First User');
    service.recordLogin('Second User');

    const recent = service.getRecent(1);

    expect(recent).toHaveLength(1);
    expect(recent[0]?.userName).toBe('Second User');
  });

  it('supports generic record entries with metadata', () => {
    const event = service.record({
      type: 'user_update',
      title: 'Custom update',
      description: 'Updated department assignment.',
      userId: 'user-3',
      userName: 'David Patel',
      metadata: { department: 'Sales' },
    });

    expect(event.metadata).toEqual({ department: 'Sales' });
    expect(service.activities()[0]).toEqual(event);
  });

  it('clears recorded activities', () => {
    service.recordLogin('Alex Johnson');
    service.clear();

    expect(service.activities()).toEqual([]);
  });

  it('persists activities to localStorage under app.activities', () => {
    service.recordLogin('Alex Johnson', 'user-1');

    const stored = JSON.parse(storage[ACTIVITIES_STORAGE_KEY] ?? '[]');

    expect(stored).toHaveLength(1);
    expect(stored[0]?.userName).toBe('Alex Johnson');
  });

  it('loads persisted activities after service re-instantiation', () => {
    service.recordLogin('Alex Johnson', 'user-1');
    service.recordUserCreate('Maria Chen', 'user-2');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const reloaded = TestBed.inject(ActivityService);

    expect(reloaded.activities()).toHaveLength(2);
    expect(reloaded.activities()[0]?.type).toBe('user_create');
    expect(reloaded.activities()[1]?.type).toBe('login');
  });

  it('clear removes persisted activities from localStorage', () => {
    service.recordLogin('Alex Johnson');
    expect(storage[ACTIVITIES_STORAGE_KEY]).toBeDefined();

    service.clear();

    expect(service.activities()).toEqual([]);
    expect(storage[ACTIVITIES_STORAGE_KEY]).toBeUndefined();
  });

  it('caps persisted activities at MAX_ACTIVITIES', () => {
    for (let index = 0; index < 105; index += 1) {
      service.recordLogin(`User ${index}`);
    }

    const stored = JSON.parse(storage[ACTIVITIES_STORAGE_KEY] ?? '[]');

    expect(stored).toHaveLength(100);
    expect(service.activities()).toHaveLength(100);
  });
});
