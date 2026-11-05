'use client';

import { useMemo, useState } from 'react';
import { Check, Flame, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useHabits } from '@/lib/hooks/use-entities';
import { getDayKey, habitConsistency, habitStreak } from '@/lib/utils/stats';
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

  const todayKey = getDayKey(new Date());
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? habits[0] ?? null;

  const consistency = useMemo(() => {
    if (!selectedHabit) return [] as boolean[][];
    const flat = habitConsistency(completions, selectedHabit, 12);
    const weeks: boolean[][] = [];
    for (let i = 0; i < flat.length; i += 7) {
      weeks.push(flat.slice(i, i + 7));
    }
    return weeks;
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

  const handleToggle = async (habit: Habit) => {
    const existing = completions.find(
      (completion) => completion.habit_id === habit.id && completion.completed_date === todayKey
    );
    if (existing) {
      await unmarkComplete(existing);
    } else {
      await markComplete(habit, todayKey);
    }
  };

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
                const rate = habitRate(habit, completions, 30);
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
                          <p className="mt-0.5 text-[11px] capitalize text-muted">
                            {habit.frequency} · {rate}% this month · {streak}d streak
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
                        <Badge tone={done ? 'success' : 'neutral'}>{done ? 'done' : 'pending'}</Badge>
                      </div>
                      <div className="mt-3 pl-[52px]">
                        <Progress value={rate} max={100} size="sm" tone={done ? 'success' : 'accent'} />
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </div>

            <div className="lg:col-span-2">
              {selectedHabit ? (
                <Reveal delay={100}>
                  <Card className="relative overflow-hidden p-5 sm:p-6 lg:sticky lg:top-24">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/[0.06] blur-3xl"
                    />
                    <SectionHeading
                      title={selectedHabit.name}
                      description="Last 12 weeks of consistency"
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
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-line/70 bg-surface/70 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Streak</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-text">
                          {selectedStreak}d
                        </p>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-surface/70 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">30 days</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-text">
                          {selectedRate}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <Heatmap weeks={consistency} color={selectedHabit.color} />
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
