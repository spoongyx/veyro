'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, Inbox, Pencil, Plus, Search, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks } from '@/lib/hooks/use-entities';
import { overdueTasks, getDayKey, tasksForDateKey } from '@/lib/utils/stats';
import { formatDayLabel } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, Card, EmptyState, Input, Reveal } from '@/components/ui';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import type { Task } from '@/lib/types';

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, loading, toggleTask, removeTask, refetch } = useTasks(user?.id);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('today');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const todayKey = getDayKey(new Date());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') !== '1') return;
    setEditing(null);
    setFormOpen(true);
    router.replace('/app/tasks');
  }, [router]);

  const visible = useMemo(() => {
    let list = [...tasks];
    switch (filter) {
      case 'today':
        list = tasksForDateKey(list, todayKey);
        break;
      case 'overdue':
        list = overdueTasks(list);
        break;
      case 'completed':
        list = list.filter((t) => t.status === 'done');
        break;
      case 'upcoming':
        list = list.filter((t) => t.due_date && t.due_date >= todayKey && t.status !== 'done');
        break;
      case 'all':
      default:
        break;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }

    const dayRank = (task: Task) => {
      if (task.status === 'done') return 4;
      if (task.due_date === todayKey) return 0;
      if (task.due_date && task.due_date < todayKey) return 1;
      if (task.due_date) return 2;
      return 3;
    };

    list.sort((a, b) => {
      const rank = dayRank(a) - dayRank(b);
      if (rank !== 0) return rank;
      if (a.status === 'done' && b.status === 'done') {
        return (b.completed_at ?? b.updated_at ?? '').localeCompare(a.completed_at ?? a.updated_at ?? '');
      }
      if (a.due_date && b.due_date && a.due_date !== b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      const timeA = a.due_time ?? '99:99';
      const timeB = b.due_time ?? '99:99';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return (b.created_at ?? '').localeCompare(a.created_at ?? '');
    });

    return list;
  }, [tasks, filter, query, todayKey]);

  const counts = useMemo<Record<Filter, number>>(
    () => ({
      all: tasks.length,
      today: tasksForDateKey(tasks, todayKey).length,
      upcoming: tasks.filter((t) => t.due_date && t.due_date >= todayKey && t.status !== 'done').length,
      overdue: overdueTasks(tasks).length,
      completed: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks, todayKey]
  );

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-line/70 bg-raised/40 p-1">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                  active
                    ? 'bg-accent text-accent-contrast shadow-soft'
                    : 'text-muted hover:bg-card hover:text-text'
                )}
              >
                {f.label}
                <span className={cn('tabular-nums', active ? 'text-accent-contrast/70' : 'text-muted/70')}>
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> New task
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          className="h-11 pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-[72px] w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Inbox size={28} />}
          title="No tasks here"
          body={filter === 'completed' ? 'Completed tasks will show up here.' : 'Add a task to get started.'}
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> New task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((task, index) => {
            const done = task.status === 'done';
            return (
              <Reveal key={task.id} delay={Math.min(280, index * 30)}>
                <Card className="group relative overflow-hidden p-0" variant="interactive">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 w-[3px]',
                      done
                        ? 'bg-success/40'
                        : task.priority === 'high'
                          ? 'bg-danger/70'
                          : task.priority === 'medium'
                            ? 'bg-warning/60'
                            : 'bg-line'
                    )}
                  />
                  <div className="flex items-start gap-3 p-4 pl-5">
                    <button
                      onClick={() => void toggleTask(task)}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all',
                        done
                          ? 'border-accent bg-accent text-accent-contrast'
                          : 'border-line text-transparent hover:border-accent/60'
                      )}
                      aria-label={done ? 'Mark as not done' : 'Mark as done'}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('truncate text-sm font-medium', done ? 'text-muted line-through' : 'text-text')}>
                          {task.title}
                        </span>
                        <Badge tone={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
                          {task.priority}
                        </Badge>
                        {done && <Badge tone="success">done</Badge>}
                      </div>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{task.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        {task.due_date && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-line/60 bg-raised/50 px-2 py-0.5">
                            <CalendarDays size={11} />
                            {formatDayLabel(new Date(task.due_date + 'T00:00:00'))}
                            {task.due_time ? ` · ${task.due_time}` : ''}
                          </span>
                        )}
                        {task.reminder_time && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-line/60 bg-raised/50 px-2 py-0.5">
                            <Bell size={11} />
                            Reminder
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-text"
                        aria-label="Edit task"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => void removeTask(task.id)}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete task"
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
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} task={editing} onSaved={() => void refetch()} />
    </div>
  );
}
