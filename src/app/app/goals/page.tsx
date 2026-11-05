'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, Minus, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useGoals } from '@/lib/hooks/use-entities';
import { goalSummary } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Progress, Reveal, StatCard } from '@/components/ui';
import GoalFormModal from '@/components/goals/GoalFormModal';
import type { Goal } from '@/lib/types';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, removeGoal, updateGoalById, refetch } = useGoals(user?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const summary = useMemo(() => goalSummary(goals), [goals]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await removeGoal(deleting.id);
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const adjust = (goal: Goal, direction: -1 | 1) => {
    const step = goal.unit === '%' ? 10 : 1;
    const next = Math.max(0, Math.min(goal.target_value, goal.current_value + step * direction));
    void updateGoalById(goal.id, { current_value: next, completed: next >= goal.target_value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm leading-6 text-muted">
          Turn intentions into measurable progress. Small increments count.
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> New goal
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="skeleton h-28 w-full" />
            ))}
          </div>
          <div className="skeleton h-56 w-full" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No goals yet"
          body="Create a goal like write a book or save $10k and track progress."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> New goal
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Reveal delay={0}>
              <StatCard
                label="Overall"
                value={`${summary.average}%`}
                sub="average progress"
                icon={<Target size={16} />}
                progress={{ value: summary.average, max: 100 }}
                tone="accent"
              />
            </Reveal>
            <Reveal delay={60}>
              <StatCard
                label="Active"
                value={summary.active}
                sub="goals in motion"
                icon={<Target size={16} />}
                tone="accent"
              />
            </Reveal>
            <Reveal delay={120}>
              <StatCard
                label="Completed"
                value={summary.completed}
                sub="goals achieved"
                icon={<Check size={16} />}
                tone="success"
              />
            </Reveal>
            <Reveal delay={180}>
              <StatCard
                label="Total"
                value={summary.total}
                sub="goals tracked"
                icon={<Target size={16} />}
                tone="warning"
              />
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {goals.map((goal, index) => {
              const pct =
                goal.target_value > 0
                  ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                  : 0;
              return (
                <Reveal key={goal.id} delay={Math.min(240, index * 40)}>
                  <Card
                    variant="interactive"
                    className={cn(
                      'relative flex h-full flex-col overflow-hidden p-5',
                      goal.completed && 'border-success/25'
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-accent/[0.06] blur-3xl"
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-text">{goal.title}</p>
                          {goal.completed ? <Badge tone="success">complete</Badge> : null}
                        </div>
                        {goal.description ? (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{goal.description}</p>
                        ) : null}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span className="rounded-full border border-line/60 bg-raised/50 px-2 py-0.5 tabular-nums">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-line/60 bg-raised/50 px-2 py-0.5">
                            <CalendarDays size={11} />
                            {goal.deadline
                              ? new Date(`${goal.deadline}T00:00:00`).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No deadline'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          void updateGoalById(goal.id, {
                            completed: !goal.completed,
                            current_value: !goal.completed ? goal.target_value : goal.current_value,
                          })
                        }
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all',
                          goal.completed
                            ? 'border-success bg-success text-accent-contrast'
                            : 'border-line text-transparent hover:border-success/40 hover:text-success'
                        )}
                        aria-label={goal.completed ? 'Mark goal not completed' : 'Mark goal completed'}
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="relative mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Progress</span>
                        <span className="font-semibold tabular-nums text-text">{pct}%</span>
                      </div>
                      <Progress value={pct} max={100} tone={goal.completed ? 'success' : 'accent'} />
                    </div>

                    <div className="relative mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => adjust(goal, -1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-40"
                          disabled={goal.current_value <= 0}
                          aria-label="Decrease progress"
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() => adjust(goal, 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-40"
                          disabled={goal.current_value >= goal.target_value}
                          aria-label="Increase progress"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(goal);
                            setFormOpen(true);
                          }}
                          className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-text"
                          aria-label="Edit goal"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(goal)}
                          className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete goal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </>
      )}

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} goal={editing} onSaved={() => void refetch()} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleting?.title ?? 'goal'}?`}
        description="This removes the goal and its progress history."
        loading={deleteLoading}
      />
    </div>
  );
}
