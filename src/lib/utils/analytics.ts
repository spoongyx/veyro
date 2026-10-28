import type { FocusSession, Goal, Habit, HabitCompletion, Task } from '@/lib/types';
import { addDays, getWeekStart, startOfDay } from './dates';
import { getDayKey, habitStreak } from './stats';

export type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface HeatCell {
  dateKey: string;
  count: number;
  level: HeatLevel;
  inRange: boolean;
}

export interface YearHeatmapData {
  weeks: HeatCell[][];
  monthLabels: { label: string; weekIndex: number }[];
  total: number;
  activeDays: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  value: number;
}

function levelForCount(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count <= 5) return 4;
  return 5;
}

export function buildYearHeatmap(completions: HabitCompletion[]): YearHeatmapData {
  const counts = new Map<string, number>();
  for (const completion of completions) {
    counts.set(completion.completed_date, (counts.get(completion.completed_date) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  const weekStart = getWeekStart(today);
  const end = addDays(weekStart, 6);
  const start = addDays(end, -(53 * 7 - 1));

  const weeks: HeatCell[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let previousMonth = -1;
  let total = 0;
  let activeDays = 0;

  for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
    const week: HeatCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(start, weekIndex * 7 + dayIndex);
      const key = getDayKey(date);
      const count = counts.get(key) ?? 0;
      const inRange = date.getTime() <= today.getTime();
      if (inRange) {
        total += count;
        if (count > 0) activeDays += 1;
      }
      week.push({ dateKey: key, count, level: inRange ? levelForCount(count) : 0, inRange });
    }
    weeks.push(week);

    const monday = addDays(start, weekIndex * 7);
    if (weekIndex === 0 || monday.getMonth() !== previousMonth) {
      monthLabels.push({
        label: monday.toLocaleDateString(undefined, { month: 'short' }),
        weekIndex,
      });
      previousMonth = monday.getMonth();
    }
  }

  return { weeks, monthLabels, total, activeDays };
}

export function cumulativeTaskSeries(tasks: Task[], days = 30): SeriesPoint[] {
  const daily = tasksCompletedPerDay(tasks, days);
  if (!daily.length) return daily;
  const firstKey = daily[0].key;
  let running = tasks.filter(
    (task) =>
      task.status === 'done' &&
      task.completed_at &&
      getDayKey(new Date(task.completed_at)) < firstKey
  ).length;

  return daily.map((point) => {
    running += point.value;
    return { ...point, value: running };
  });
}

export function tasksCompletedPerDay(tasks: Task[], days = 30): SeriesPoint[] {
  const today = startOfDay(new Date());
  const completedCounts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== 'done' || !task.completed_at) continue;
    const key = getDayKey(new Date(task.completed_at));
    completedCounts.set(key, (completedCounts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - (days - 1));
    const key = getDayKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: completedCounts.get(key) ?? 0,
    };
  });
}

export function focusMinutesSeries(sessions: FocusSession[], days = 14): SeriesPoint[] {
  const today = startOfDay(new Date());
  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    if (!session.completed) continue;
    const key = getDayKey(new Date(session.created_at));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.duration_minutes);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - (days - 1));
    const key = getDayKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: minutesByDay.get(key) ?? 0,
    };
  });
}

export function totalTasksCompleted(tasks: Task[]): number {
  return tasks.filter((task) => task.status === 'done').length;
}

export function totalFocusMinutes(sessions: FocusSession[]): number {
  return sessions.filter((session) => session.completed).reduce((sum, session) => sum + session.duration_minutes, 0);
}

export function bestHabitStreak(habits: Habit[], completions: HabitCompletion[]): number {
  return habits.reduce((best, habit) => Math.max(best, habitStreak(completions, habit)), 0);
}

export function habitCompletionRate(habits: Habit[], completions: HabitCompletion[], days = 30): number | null {
  if (!habits.length) return null;
  const today = startOfDay(new Date());
  let possible = 0;
  let done = 0;
  for (const habit of habits) {
    for (let index = 0; index < days; index += 1) {
      const date = addDays(today, -index);
      const key = getDayKey(date);
      if (habit.created_at && habit.created_at.slice(0, 10) > key) continue;
      possible += 1;
      if (completions.some((completion) => completion.habit_id === habit.id && completion.completed_date === key)) {
        done += 1;
      }
    }
  }
  if (possible === 0) return null;
  return Math.round((done / possible) * 100);
}

export function habitRate(habit: Habit, completions: HabitCompletion[], days = 30): number {
  const today = startOfDay(new Date());
  let possible = 0;
  let done = 0;
  for (let index = 0; index < days; index += 1) {
    const date = addDays(today, -index);
    const key = getDayKey(date);
    if (habit.created_at && habit.created_at.slice(0, 10) > key) continue;
    possible += 1;
    if (completions.some((completion) => completion.habit_id === habit.id && completion.completed_date === key)) {
      done += 1;
    }
  }
  return possible > 0 ? Math.round((done / possible) * 100) : 0;
}

export function priorityBreakdown(tasks: Task[]): { label: string; value: number; tone: 'low' | 'medium' | 'high' }[] {
  const open = tasks.filter((task) => task.status !== 'done');
  return [
    { label: 'High', value: open.filter((task) => task.priority === 'high').length, tone: 'high' as const },
    { label: 'Medium', value: open.filter((task) => task.priority === 'medium').length, tone: 'medium' as const },
    { label: 'Low', value: open.filter((task) => task.priority === 'low').length, tone: 'low' as const },
  ];
}

export function goalSummary(goals: Goal[]): { average: number; completed: number; active: number; total: number } {
  const active = goals.filter((goal) => !goal.completed);
  const average = active.length
    ? Math.round(
        active.reduce(
          (sum, goal) => sum + Math.min(100, (goal.current_value / Math.max(1, goal.target_value)) * 100),
          0
        ) / active.length
      )
    : goals.length
      ? 100
      : 0;
  return {
    average,
    completed: goals.filter((goal) => goal.completed).length,
    active: active.length,
    total: goals.length,
  };
}
