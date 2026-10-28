export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    theme?: 'light' | 'midnight';
    [key: string]: unknown;
  };
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  reminder_time?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string;
  frequency: 'daily' | 'weekly';
  target_days: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  completed: boolean;
  session_type: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  created_at: string;
}

export interface AppNotificationSettings {
  reminders: boolean;
  pomodoroAlerts: boolean;
  dailySummary: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}
