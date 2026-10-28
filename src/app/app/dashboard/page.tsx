'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks, useHabits, useGoals, useFocusSessions } from '@/lib/hooks/use-entities';
import { checkTaskReminders, showAppNotification } from '@/lib/notifications';
import {
  completionRate,
  focusMinutesToday,
  getDayKey,
  habitStreak,
  overdueTasks,
  overallGoalProgress,
  tasksCompletedOn,
  tasksForDateKey,
  weeklyStats,
} from '@/lib/utils/stats';
import {
  bestHabitStreak,
  buildYearHeatmap,
  cumulativeTaskSeries,
  focusMinutesSeries,
  habitCompletionRate,
  totalFocusMinutes,
  totalTasksCompleted,
} from '@/lib/utils/analytics';
import { formatDayLabel } from '@/lib/utils/dates';
import { Button, Card, EmptyState, Progress, SectionHeading, StatCard } from '@/components/ui';
import { BarChart, LineChart, WeeklyBarChart, YearHeatmap } from '@/components/charts';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Flame,
  ListTodo,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { tasks, loading, toggleTask } = useTasks(user?.id);
  const { habits, completions, loading: habitsLoading } = useHabits(user?.id);
  const { goals } = useGoals(user?.id);
  const { sessions } = useFocusSessions(user?.id);

  const todayKey = getDayKey(new Date());
  const todays = tasksForDateKey(tasks, todayKey);
  const doneToday = tasksCompletedOn(tasks, todayKey);
  const completionPct = completionRate(tasks, todayKey);
  const overdue = overdueTasks(tasks);
  const stats = weeklyStats(tasks, 7);
  const focusMinutes = focusMinutesToday(sessions);
  const goalProgress = overallGoalProgress(goals);

  const yearHeatmap = useMemo(() => buildYearHeatmap(completions), [completions]);
  const momentum = useMemo(() => cumulativeTaskSeries(tasks, 30), [tasks]);
  const focusSeries = useMemo(() => focusMinutesSeries(sessions, 14), [sessions]);
  const consistency = useMemo(() => habitCompletionRate(habits, completions, 30), [habits, completions]);
  const bestStreak = useMemo(() => bestHabitStreak(habits, completions), [habits, completions]);
  const focusTotal = useMemo(() => totalFocusMinutes(sessions), [sessions]);
  const tasksTotal = useMemo(() => totalTasksCompleted(tasks), [tasks]);

  useEffect(() => {
    if (loading) return;
    checkTaskReminders(tasks, (task, remindAt) => {
      void showAppNotification(`Reminder: ${task.title}`, {
        body: `Time to focus - due at ${remindAt.toLocaleTimeString()}.`,
        tag: `task-${task.id}`,
      });
    });
  }, [tasks, loading]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const habitsDoneCount = habits.filter((habit) => {
    if (habit.frequency === 'daily') {
      return completions.some((completion) => completion.habit_id === habit.id && completion.completed_date === todayKey);
    }
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekKey = getDayKey(weekStart);
    const count = completions.filter((completion) => completion.habit_id === habit.id && completion.completed_date >= weekKey).length;
    const target = habit.target_days > 0 ? habit.target_days : 7;
    return count >= target;
  }).length;

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="skeleton h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted">{formatDayLabel(new Date())}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-text">
            {greeting}. <span className="font-medium text-muted">{user.email?.split('@')[0]}</span>
          </h2>
          <p className="mt-2 text-sm text-muted">Here is the shape of your day so far.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/app/focus')}>
            <Timer size={15} /> Focus
          </Button>
          <Button onClick={() => router.push('/app/tasks?new=1')}>
            + New task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={`${completionPct ?? 0}%`}
          sub={`${doneToday.length} of ${todays.length} tasks complete`}
          icon={<Check size={16} />}
          progress={{ value: completionPct ?? 0, max: 100 }}
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={overdue.length}
          sub={overdue.length === 0 ? 'Nothing needs rescue' : 'tasks need attention'}
          icon={<AlertCircle size={16} />}
          tone={overdue.length > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Habits"
          value={
            <span>
              {habitsDoneCount}
              <span className="text-lg font-medium text-muted">/{habits.length}</span>
            </span>
          }
          sub={consistency === null ? 'No habits yet' : `${consistency}% consistency this month`}
          icon={<Flame size={16} />}
          progress={habits.length ? { value: habitsDoneCount, max: habits.length } : undefined}
          tone="warning"
        />
        <StatCard
          label="Focus today"
          value={
            <span>
              {focusMinutes}
              <span className="ml-1 text-base font-medium text-muted">min</span>
            </span>
          }
          sub={`${Math.round(focusTotal / 60)}h total deep work`}
          icon={<Timer size={16} />}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 sm:p-6">
          <SectionHeading
            title="Today's tasks"
            description="Small steps, one at a time."
            action={
              <Link
                href="/app/tasks"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-text"
              >
                View all <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="skeleton h-14 w-full" />
                ))}
              </div>
            ) : todays.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={24} />}
                title="Nothing scheduled"
                body="A clear day is a good day. Add a task when you are ready."
                action={
                  <Button size="sm" onClick={() => router.push('/app/tasks?new=1')}>
                    Add a task
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {todays.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => void toggleTask(task)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition-all duration-200 hover:border-accent/20 hover:bg-raised"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        task.status === 'done'
                          ? 'border-success bg-success text-accent-contrast'
                          : 'border-line text-transparent group-hover:border-accent/40'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted line-through' : 'text-text'}`}>
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[11px] capitalize text-muted">
                        {task.priority} priority{task.due_time ? ` - ${task.due_time}` : ''}
                      </p>
                    </div>
                    {task.priority === 'high' && task.status !== 'done' ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-danger" aria-label="High priority" />
                    ) : null}
                  </button>
                ))}
                <div className="flex items-center justify-between px-1 pt-2 text-xs text-muted">
                  <span>
                    {doneToday.length} done - {Math.max(0, todays.length - doneToday.length)} remaining
                  </span>
                  <span>{Math.round(((doneToday.length || 0) / Math.max(1, todays.length)) * 100)}%</span>
                </div>
                <Progress value={doneToday.length} max={Math.max(1, todays.length)} size="sm" tone="success" />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<TrendingUp size={16} />}
            title="Last 7 days"
            description={`${tasksTotal} tasks completed all time`}
          />
          <div className="mt-5">
            <WeeklyBarChart data={stats} height={190} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Timer size={16} />}
            title="Focus rhythm"
            description="Minutes of deep work over the last 14 days."
          />
          <div className="mt-5">
            {focusTotal === 0 ? (
              <EmptyState
                icon={<Timer size={24} />}
                title="No focus sessions yet"
                body="Start a 25-minute session and your rhythm will appear here."
                action={
                  <Button size="sm" variant="outline" onClick={() => router.push('/app/focus')}>
                    Start focusing
                  </Button>
                }
              />
            ) : (
              <BarChart data={focusSeries} height={160} />
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<TrendingUp size={16} />}
            title="Momentum"
            description={`${tasksTotal} tasks completed over the last 30 days.`}
          />
          <div className="mt-5">
            <LineChart data={momentum} height={190} />
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeading
          icon={<Flame size={16} />}
          title="A year of showing up"
          description={`${yearHeatmap.total} completions across ${yearHeatmap.activeDays} active days.`}
        />
        <div className="mt-5">
          <YearHeatmap data={yearHeatmap} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<AlertCircle size={16} />}
            title="Overdue"
            action={
              overdue.length > 0 ? (
                <Link href="/app/tasks" className="text-xs font-semibold text-muted hover:text-text">
                  Review
                </Link>
              ) : undefined
            }
          />
          <div className="mt-4 space-y-2">
            {overdue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
                Nothing overdue. Nicely held.
              </p>
            ) : (
              overdue.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-text">{task.title}</span>
                  <span className="shrink-0 text-[11px] font-medium text-danger">{task.due_date}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Flame size={16} />}
            title="Habits"
            description={bestStreak > 0 ? `Best streak: ${bestStreak} days` : 'Build a rhythm'}
            action={
              <Link href="/app/habits" className="text-xs font-semibold text-muted hover:text-text">
                Open
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {habitsLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="skeleton h-11 w-full" />
                ))}
              </div>
            ) : habits.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
                Create a habit to start a streak.
              </p>
            ) : (
              habits.slice(0, 4).map((habit) => {
                const streak = habitStreak(completions, habit);
                const done = completions.some(
                  (completion) => completion.habit_id === habit.id && completion.completed_date === todayKey
                );
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5 text-sm">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
                      </span>
                      <span className="truncate text-text">{habit.name}</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-medium ${done ? 'text-success' : 'text-muted'}`}>
                      {done ? 'done' : `${streak}d streak`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Target size={16} />}
            title="Goals"
            description="Overall progress"
            action={
              <Link href="/app/goals" className="text-xs font-semibold text-muted hover:text-text">
                Open
              </Link>
            }
          />
          <div className="mt-4 space-y-4">
            {goals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
                Set a goal to track what matters.
              </p>
            ) : (
              goals.slice(0, 3).map((goal) => {
                const pct =
                  goal.target_value > 0
                    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                    : 0;
                return (
                  <div key={goal.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-text">{goal.title}</span>
                      <span className="shrink-0 text-xs font-medium text-muted">{pct}%</span>
                    </div>
                    <Progress value={pct} max={100} size="sm" />
                  </div>
                );
              })
            )}
            <div className="border-t border-line pt-4">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Overall</span>
                <span className="font-semibold text-text">{goalProgress}%</span>
              </div>
              <Progress value={goalProgress} max={100} size="sm" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
