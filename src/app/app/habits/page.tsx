'use client';

import { useMemo, useState } from 'react';
import { Check, Flame, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useHabits } from '@/lib/hooks/use-entities';
import {
  getDayKey,
  habitConsistencyDays,
  habitStreak,
  habitWeekProgress,
  habitWeeklyTarget,
  type HabitConsistencyDay,
} from '@/lib/utils/stats';
import { habitCompletionRate, habitRate } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils/cn';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Progress,
  Reveal,
  SectionHeading,
  StatCard,
} from '@/components/ui';
import { Heatmap } from '@/components/charts';
import HabitFormModal from '@/components/habits/HabitFormModal';
import type { Habit } from '@/lib/types';

export default function HabitsPage() {
  const { user } = useAuth();
  const { habits, completions, loading, markComplete, unmarkComplete, removeHabit, refetch } = useHabits(user?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingDay, setPendingDay] = useState<string | null>(null);

  const todayKey = getDayKey(new Date());
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? habits[0] ?? null;

  const consistencyWeeks = useMemo(() => {
    if (!selectedHabit) return [] as HabitConsistencyDay[][];
    const flat = habitConsistencyDays(completions, selectedHabit, 12);
    const weeks: HabitConsistencyDay[][] = [];
    for (let i = 0; i < flat.length; i += 7) {
      weeks.push(flat.slice(i, i + 7));
    }
    return weeks;
  }, [completions, selectedHabit]);

  const recentDays = useMemo(() => {
    if (!selectedHabit) return [];
    const now = new Date();
    return Array.from({ length: 7 }, (_, offset) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const dateKey = getDayKey(day);
      return {
        dateKey,
        done: completions.some(
          (completion) => completion.habit_id === selectedHabit.id && completion.completed_date === dateKey
        ),
        isToday: offset === 0,
        weekday: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNumber: day.getDate(),
        fullLabel: day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      };
    });
  }, [completions, selectedHabit]);

  const doneToday = habits.filter((habit) =>
    completions.some((completion) => completion.habit_id === habit.id && completion.completed_date === todayKey)
  ).length;
  const monthlyConsistency = useMemo(() => habitCompletionRate(habits, completions, 30), [habits, completions]);
  const bestStreak = useMemo(
    () => habits.reduce((best, habit) => Math.max(best, habitStreak(completions, habit)), 0),
    [habits, completions]
  );
  const selectedRate = selectedHabit ? habitRate(selectedHabit, completions, 30) : 0;
  const selectedStreak = selectedHabit ? habitStreak(completions, selectedHabit) : 0;
  const selectedWeek = selectedHabit ? habitWeekProgress(completions, selectedHabit) : null;
  const selectedStreakUnit = selectedHabit && habitWeeklyTarget(selectedHabit) < 7 ? 'w' : 'd';

  const handleToggleDay = async (habit: Habit, dateKey: string) => {
    const pendingKey = `${habit.id}:${dateKey}`;
    if (pendingDay === pendingKey) return;
    setPendingDay(pendingKey);
    try {
      const existing = completions.find(
        (completion) => completion.habit_id === habit.id && completion.completed_date === dateKey
      );
      if (existing) {
        await unmarkComplete(existing);
      } else {
        await markComplete(habit, dateKey);
      }
    } finally {
      setPendingDay(null);
    }
  };

  const handleToggle = (habit: Habit) => handleToggleDay(habit, todayKey);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await removeHabit(deleting.id);
      if (selectedHabitId === deleting.id) setSelectedHabitId(null);
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-28 w-full" />
          ))}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm leading-6 text-muted">
          Small repeated actions become identity. Check in daily and let the heatmap tell the story.
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> New habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={<Flame size={28} />}
          title="No habits yet"
          body="Create a habit like read daily or work out, then start your streak."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> New habit
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Reveal delay={0}>
              <StatCard
                label="Today"
                value={`${doneToday}/${habits.length}`}
                sub="checked in"
                icon={<Check size={16} />}
                progress={{ value: doneToday, max: habits.length }}
                tone="success"
              />
            </Reveal>
            <Reveal delay={60}>
              <StatCard
                label="30-day consistency"
                value={monthlyConsistency === null ? '-' : `${monthlyConsistency}%`}
                sub="across all habits"
                icon={<Flame size={16} />}
                progress={monthlyConsistency === null ? undefined : { value: monthlyConsistency, max: 100 }}
                tone="warning"
              />
            </Reveal>
            <Reveal delay={120}>
              <StatCard
                label="Best streak"
                value={`${bestStreak}d`}
                sub="keep the chain alive"
                icon={<Flame size={16} />}
                tone="accent"
              />
            </Reveal>
            <Reveal delay={180}>
              <StatCard
                label="Active"
                value={habits.length}
                sub="habits in your routine"
                icon={<Check size={16} />}
                tone="accent"
              />
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-3">
              {habits.map((habit, index) => {
                const done = completions.some(
                  (completion) => completion.habit_id === habit.id && completion.completed_date === todayKey
                );
                const streak = habitStreak(completions, habit);
                const week = habitWeekProgress(completions, habit);
                const weekMet = week.done >= week.target;
                const streakUnit = habitWeeklyTarget(habit) < 7 ? 'w' : 'd';
                const isSelected = selectedHabit?.id === habit.id;
                return (
                  <Reveal key={habit.id} delay={Math.min(240, index * 40)}>
                    <Card
                      variant="interactive"
                      className={cn(
                        'relative overflow-hidden p-4',
                        isSelected && 'border-accent/35 bg-accent/[0.04]'
                      )}
                    >
                      {isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-accent"
                        />
                      ) : null}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => void handleToggle(habit)}
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                            done
                              ? 'border-accent bg-accent text-accent-contrast shadow-[0_0_20px_-6px_rgb(var(--accent)/0.8)]'
                              : 'border-line text-transparent hover:border-accent/50 hover:bg-accent-soft'
                          )}
                          aria-label={done ? 'Mark habit not done' : 'Mark habit done'}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button onClick={() => setSelectedHabitId(habit.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
                            <p className="truncate text-sm font-semibold text-text">{habit.name}</p>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {week.target === 7 ? 'daily' : `${week.target} days/week`} · {week.done}/{week.target} this
                            week · {streak}
                            {streakUnit} streak
                          </p>
                        </button>
                        <div className="hidden items-center gap-1 sm:flex">
                          <button
                            onClick={() => {
                              setEditing(habit);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-text"
                            aria-label="Edit habit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleting(habit)}
                            className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            aria-label="Delete habit"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <Badge tone={weekMet || done ? 'success' : 'neutral'}>
                          {weekMet ? 'week met' : done ? 'done' : 'pending'}
                        </Badge>
                      </div>
                      <div className="mt-3 pl-[52px]">
                        <Progress value={week.percent} max={100} size="sm" tone={weekMet ? 'success' : 'accent'} />
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </div>

            <div className="lg:col-span-2">
              {selectedHabit ? (
                <Reveal delay={100}>
                  <Card className="relative overflow-hidden p-0 lg:sticky lg:top-24">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/[0.06] blur-3xl"
                    />
                    <div className="relative p-5 sm:p-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:[scrollbar-width:thin]">
                      <SectionHeading
                        title={selectedHabit.name}
                        description="Last 12 weeks · tap a day to edit"
                      action={
                        <button
                          onClick={() => {
                            setEditing(selectedHabit);
                            setFormOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-text"
                          aria-label="Edit habit"
                        >
                          <Pencil size={15} />
                        </button>
                      }
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-line/70 bg-surface/70 px-2.5 py-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Streak</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.03em] text-text">
                          {selectedStreak}
                          {selectedStreakUnit}
                        </p>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-surface/70 px-2.5 py-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">This week</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.03em] text-text">
                          {selectedWeek?.done ?? 0}/{selectedWeek?.target ?? 7}
                        </p>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-surface/70 px-2.5 py-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">30 days</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums tracking-[-0.03em] text-text">
                          {selectedRate}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 rounded-2xl border border-line/70 bg-surface/60 p-3">
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Last 7 days</p>
                        <p className="text-[10px] text-muted">Tap to edit</p>
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {recentDays.map((day) => {
                          const pending = pendingDay === `${selectedHabit.id}:${day.dateKey}`;
                          return (
                            <button
                              key={day.dateKey}
                              type="button"
                              onClick={() => void handleToggleDay(selectedHabit, day.dateKey)}
                              disabled={pending}
                              aria-pressed={day.done}
                              aria-label={`${day.fullLabel}: ${day.done ? 'completed' : 'not completed'}. Click to ${
                                day.done ? 'uncheck' : 'check'
                              }.`}
                              title={`${day.fullLabel} · ${day.done ? 'Completed' : 'Not completed'}`}
                              className={cn(
                                'group flex flex-col items-center gap-1.5 rounded-xl px-0.5 py-2 transition-colors disabled:opacity-60',
                                !day.done && 'hover:bg-raised/70'
                              )}
                            >
                              <span
                                className={cn(
                                  'text-[9px] font-semibold uppercase tracking-[0.08em]',
                                  day.done ? 'text-text' : day.isToday ? 'text-accent' : 'text-muted'
                                )}
                              >
                                {day.isToday ? 'Today' : day.weekday}
                              </span>
                              <span
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition-all',
                                  day.done
                                    ? 'border-accent bg-accent text-accent-contrast shadow-[0_0_18px_-8px_rgb(var(--accent)/0.9)]'
                                    : cn(
                                        'border-line/80 bg-ink/30 text-muted group-hover:border-accent/50',
                                        day.isToday && 'border-accent/60 bg-accent/[0.06] text-accent'
                                      )
                                )}
                              >
                                {pending ? (
                                  <Loader2
                                    size={13}
                                    className={cn('animate-spin', day.done ? 'text-accent-contrast' : 'text-accent')}
                                  />
                                ) : day.done ? (
                                  <Check size={14} strokeWidth={3} />
                                ) : (
                                  day.dateNumber
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-5">
                      <Heatmap
                        weeks={consistencyWeeks}
                        color={selectedHabit.color}
                        onToggleDay={(dateKey) => void handleToggleDay(selectedHabit, dateKey)}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-muted">
                      <span>12 weeks ago</span>
                      <span className="flex items-center gap-1.5">
                        Less
                        <span className="h-2.5 w-2.5 rounded-[2px] bg-raised" />
                        <span
                          className="h-2.5 w-2.5 rounded-[2px]"
                          style={{ backgroundColor: selectedHabit.color }}
                        />
                        More
                      </span>
                      <span>Today</span>
                    </div>
                    </div>
                  </Card>
                </Reveal>
              ) : null}
            </div>
          </div>
        </>
      )}

      <HabitFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        habit={editing}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleting?.name ?? 'habit'}?`}
        description="This removes the habit and its completion history."
        loading={deleteLoading}
      />
    </div>
  );
}
