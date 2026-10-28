'use client';

import { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useGoals } from '@/lib/hooks/use-entities';
import { goalSummary } from '@/lib/utils/analytics';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Progress, StatCard } from '@/components/ui';
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
            <StatCard
              label="Overall"
              value={`${summary.average}%`}
              sub="average progress"
              icon={<Target size={16} />}
              progress={{ value: summary.average, max: 100 }}
              tone="accent"
            />
            <StatCard label="Active" value={summary.active} sub="goals in motion" icon={<Target size={16} />} tone="accent" />
            <StatCard label="Completed" value={summary.completed} sub="goals achieved" icon={<Check size={16} />} tone="success" />
            <StatCard label="Total" value={summary.total} sub="goals tracked" icon={<Target size={16} />} tone="warning" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {goals.map((goal) => {
              const pct =
                goal.target_value > 0
                  ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                  : 0;
              return (
                <Card key={goal.id} variant="interactive" className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-text">{goal.title}</p>
                        {goal.completed ? <Badge tone="success">complete</Badge> : null}
                      </div>
                      {goal.description ? <p className="mt-1 text-sm leading-6 text-muted">{goal.description}</p> : null}
                      <p className="mt-2 text-xs text-muted">
                        {goal.current_value} {goal.unit} of {goal.target_value} {goal.unit}
                        <span className="mx-1.5 text-line">|</span>
                        {goal.deadline
                          ? `Due ${new Date(`${goal.deadline}T00:00:00`).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}`
                          : 'No deadline'}
                      </p>
                    </div>
                    <button
                      onClick={() => void updateGoalById(goal.id, { completed: !goal.completed, current_value: !goal.completed ? goal.target_value : goal.current_value })}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        goal.completed
                          ? 'border-success bg-success text-accent-contrast'
                          : 'border-line text-transparent hover:border-success/40 hover:text-success'
                      }`}
                      aria-label={goal.completed ? 'Mark goal not completed' : 'Mark goal completed'}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Progress</span>
                      <span className="font-semibold text-text">{pct}%</span>
                    </div>
                    <Progress value={pct} max={100} tone={goal.completed ? 'success' : 'accent'} />
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => adjust(goal, -1)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-40"
                        disabled={goal.current_value <= 0}
                      >
                        - step
                      </button>
                      <button
                        onClick={() => adjust(goal, 1)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-40"
                        disabled={goal.current_value >= goal.target_value}
                      >
                        + step
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
