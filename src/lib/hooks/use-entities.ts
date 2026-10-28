import { useCallback, useEffect, useState } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from '@/lib/db';
import { fetchHabits, createHabit, updateHabit, deleteHabit, fetchHabitCompletions, insertHabitCompletion, deleteHabitCompletion } from '@/lib/db';
import { fetchGoals, createGoal, updateGoal, deleteGoal } from '@/lib/db';
import { fetchFocusSessions, createFocusSession } from '@/lib/db';
import type { Task, Habit, HabitCompletion, Goal, FocusSession } from '@/lib/types';

export function useTasks(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      setTasks(await fetchTasks(userId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = useCallback(
    async (input: Parameters<typeof createTask>[1]) => {
      const task = await createTask(userId!, input);
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [userId]
  );

  const updateTaskById = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const task = await updateTask(id, patch);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      return task;
    },
    []
  );

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTask = useCallback(
    async (task: Task) => {
      const completed = task.status !== 'done';
      const updated: Task = {
        ...task,
        status: completed ? 'done' : 'todo',
        completed_at: completed ? new Date().toISOString() : null,
      };
      await updateTaskById(task.id, updated);
      return updated;
    },
    [updateTaskById]
  );

  return { tasks, loading, error, refetch: load, addTask, updateTaskById, removeTask, toggleTask };
}

export function useHabits(userId?: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setHabits([]);
      setCompletions([]);
      return;
    }
    setLoading(true);
    try {
      const [h, c] = await Promise.all([fetchHabits(userId), fetchHabitCompletions(userId)]);
      setHabits(h);
      setCompletions(c);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addHabit = useCallback(
    async (input: Parameters<typeof createHabit>[1]) => {
      const habit = await createHabit(userId!, input);
      setHabits((prev) => [...prev, habit]);
      return habit;
    },
    [userId]
  );

  const updateHabitById = useCallback(async (id: string, patch: Partial<Habit>) => {
    const habit = await updateHabit(id, patch);
    setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
    return habit;
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
  }, []);

  const markComplete = useCallback(
    async (habit: Habit, completedDate: string) => {
      const completion = await insertHabitCompletion(habit.id, userId!, completedDate);
      setCompletions((prev) => [...prev, completion]);
      return completion;
    },
    [userId]
  );

  const unmarkComplete = useCallback(async (completion: HabitCompletion) => {
    await deleteHabitCompletion(completion.id);
    setCompletions((prev) => prev.filter((c) => c.id !== completion.id));
  }, []);

  return { habits, completions, loading, error, refetch: load, addHabit, updateHabitById, removeHabit, markComplete, unmarkComplete };
}

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setGoals([]);
      return;
    }
    setLoading(true);
    try {
      setGoals(await fetchGoals(userId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addGoal = useCallback(
    async (input: Parameters<typeof createGoal>[1]) => {
      const goal = await createGoal(userId!, input);
      setGoals((prev) => [goal, ...prev]);
      return goal;
    },
    [userId]
  );

  const updateGoalById = useCallback(async (id: string, patch: Partial<Goal>) => {
    const goal = await updateGoal(id, patch);
    setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)));
    return goal;
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { goals, loading, error, refetch: load, addGoal, updateGoalById, removeGoal };
}

export function useFocusSessions(userId?: string) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      setSessions(await fetchFocusSessions(userId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addSession = useCallback(
    async (durationMinutes: number, sessionType: FocusSession['session_type'], completed: boolean) => {
      const session = await createFocusSession(userId!, durationMinutes, sessionType, completed);
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [userId]
  );

  return { sessions, loading, error, refetch: load, addSession };
}
