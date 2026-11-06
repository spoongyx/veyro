import { createClient } from './supabase/client';
import type { Task, Habit, HabitCompletion, Goal, FocusSession } from '@/lib/types';

function sb() {
  return createClient();
}

function notifyTasksChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('veyro:tasks-changed'));
  }
}

// ---------- Tasks ----------

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await sb()
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function createTask(
  userId: string,
  input: Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'due_time' | 'reminder_time'>
): Promise<Task> {
  const { data, error } = await sb()
    .from('tasks')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  notifyTasksChanged();
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const { data, error } = await sb()
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  notifyTasksChanged();
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await sb().from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  notifyTasksChanged();
}

// ---------- Habits ----------

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await sb()
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Habit[];
}

export async function createHabit(
  userId: string,
  input: Pick<Habit, 'name' | 'description' | 'color' | 'frequency' | 'target_days'>
): Promise<Habit> {
  const { data, error } = await sb()
    .from('habits')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Habit;
}

export async function updateHabit(id: string, patch: Partial<Habit>): Promise<Habit> {
  const { data, error } = await sb()
    .from('habits')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await sb().from('habits').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchHabitCompletions(userId: string): Promise<HabitCompletion[]> {
  const { data, error } = await sb()
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as HabitCompletion[];
}

export async function insertHabitCompletion(
  habitId: string,
  userId: string,
  completedDate: string
): Promise<HabitCompletion> {
  const { data, error } = await sb()
    .from('habit_completions')
    .insert({ habit_id: habitId, user_id: userId, completed_date: completedDate })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HabitCompletion;
}

export async function deleteHabitCompletion(id: string): Promise<void> {
  const { error } = await sb().from('habit_completions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------- Goals ----------

export async function fetchGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await sb()
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Goal[];
}

export async function createGoal(
  userId: string,
  input: Pick<Goal, 'title' | 'description' | 'target_value' | 'current_value' | 'unit' | 'deadline'>
): Promise<Goal> {
  const { data, error } = await sb()
    .from('goals')
    .insert({ ...input, user_id: userId, completed: false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Goal;
}

export async function updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
  const { data, error } = await sb()
    .from('goals')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await sb().from('goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------- Focus sessions ----------

export async function fetchFocusSessions(userId: string): Promise<FocusSession[]> {
  const { data, error } = await sb()
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FocusSession[];
}

export async function createFocusSession(
  userId: string,
  durationMinutes: number,
  sessionType: FocusSession['session_type'],
  completed: boolean
): Promise<FocusSession> {
  const { data, error } = await sb()
    .from('focus_sessions')
    .insert({ user_id: userId, duration_minutes: durationMinutes, session_type: sessionType, completed })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FocusSession;
}
