import type { Task, Habit, HabitCompletion, Goal, FocusSession } from '@/lib/types';
import { startOfDay } from './dates';

export function getDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function tasksForDateKey(tasks: Task[], dateKey: string): Task[] {
  return tasks
    .filter((t) => t.due_date === dateKey)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function tasksCompletedOn(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter(
    (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === dateKey
  );
}

export function completionRate(tasks: Task[], dateKey: string): number | null {
  const todays = tasksForDateKey(tasks, dateKey);
  if (!todays.length) return null;
  const done = tasksCompletedOn(tasks, dateKey).length;
  return Math.round((done / todays.length) * 100);
}

export function overdueTasks(tasks: Task[]): Task[] {
  const todayKey = getDayKey(new Date());
  return tasks
    .filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayKey)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : a.due_date! > b.due_date! ? 1 : 0));
}

export function todaysTasks(tasks: Task[]): Task[] {
  const todayKey = getDayKey(new Date());
  return tasks
    .filter((t) => t.due_date === todayKey || t.status === 'in_progress')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export interface DayStat {
  key: string;
  label: string;
  completed: number;
  total: number;
}

export function weeklyStats(tasks: Task[], days = 7): DayStat[] {
  const out: DayStat[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = getDayKey(d);
    const todays = tasksForDateKey(tasks, key);
    const completed = tasksCompletedOn(tasks, key).length;
    out.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      completed,
      total: todays.length,
    });
  }
  return out;
}

export function habitStreak(completions: HabitCompletion[], habit: Habit, today: Date = new Date()): number {
  if (habit.frequency === 'weekly') {
    const target = habit.target_days > 0 ? habit.target_days : 1;
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const weekKeys = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = completions.filter((c) => c.habit_id === habit.id && c.completed_date === key).length;
      return { key, count };
    });
    let streak = 0;
    for (let i = weekKeys.length - 1; i >= 0; i--) {
      if (weekKeys[i].count >= target) streak++;
      else break;
    }
    return streak;
  }

  const completedKeys = new Set(completions.filter((c) => c.habit_id === habit.id).map((c) => c.completed_date));
  let streak = 0;
  let cursor = startOfDay(today);
  if (!completedKeys.has(getDayKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000);
  }
  while (completedKeys.has(getDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export function habitConsistency(completions: HabitCompletion[], habit: Habit, weeks = 12): boolean[] {
  const out: boolean[] = [];
  const today = startOfDay(new Date());
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setDate(weekStart.getDate() - (weeks - 1) * 7);

  const completedKeys = new Set(
    completions.filter((c) => c.habit_id === habit.id).map((c) => c.completed_date)
  );

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    out.push(d <= today && completedKeys.has(getDayKey(d)));
  }
  return out;
}

export function focusMinutesToday(sessions: FocusSession[]): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  let minutes = 0;
  for (const s of sessions) {
    if (!s.completed) continue;
    const created = new Date(s.created_at);
    if (created < todayStart) continue;
    minutes += s.duration_minutes;
  }
  return minutes;
}

export function overallGoalProgress(goals: Goal[]): number {
  if (!goals.length) return 0;
  const active = goals.filter((g) => !g.completed);
  if (!active.length) return 100;
  const sum = active.reduce(
    (acc, g) => acc + Math.min(100, (g.current_value / Math.max(1, g.target_value)) * 100),
    0
  );
  return Math.round(sum / active.length);
}

export function overallCompletionRate(tasks: Task[]): number | null {
  const todays = tasks.filter((t) => t.due_date === getDayKey(new Date())).length;
  if (!todays) return null;
  const done = tasks.filter((t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === getDayKey(new Date())).length;
  if (!todays) return null;
  return Math.round((done / todays) * 100);
}
