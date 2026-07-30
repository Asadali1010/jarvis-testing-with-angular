import { TestBed } from '@angular/core/testing';

import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActivityService],
    });

    service = TestBed.inject(ActivityService);
    service.clear();
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
});
