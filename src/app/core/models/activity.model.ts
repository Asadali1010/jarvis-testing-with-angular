export type ActivityType =
  | 'login'
  | 'user_create'
  | 'user_update'
  | 'profile_change'
  | 'settings_change';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordActivityInput {
  type: ActivityType;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}
