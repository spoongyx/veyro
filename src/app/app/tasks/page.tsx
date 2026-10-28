'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, Check, Inbox } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks } from '@/lib/hooks/use-entities';
import { overdueTasks, getDayKey, tasksForDateKey } from '@/lib/utils/stats';
import { formatDayLabel } from '@/lib/utils/dates';
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import type { Task } from '@/lib/types';

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, loading, toggleTask, removeTask, refetch } = useTasks(user?.id);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
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
    return list;
  }, [tasks, filter, query, todayKey]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? 'border-transparent bg-accent text-accent-contrast' : 'border-line text-muted hover:bg-raised hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
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
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading tasks...</p>
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
          {visible.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => void toggleTask(task)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    task.status === 'done' ? 'border-emerald-400 bg-emerald-400 text-ink' : 'border-line hover:border-text'
                  }`}
                  aria-label={task.status === 'done' ? 'Mark as not done' : 'Mark as done'}
                >
                  {task.status === 'done' && <Check size={14} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted line-through' : 'text-text'}`}>
                      {task.title}
                    </span>
                    <Badge tone={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
                      {task.priority}
                    </Badge>
                    {task.status === 'done' && <Badge tone="success">done</Badge>}
                  </div>
                  {task.description && <p className="mt-1 text-sm text-muted">{task.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    {task.due_date && (
                      <span>
                        Due {formatDayLabel(new Date(task.due_date + 'T00:00:00'))} - {task.due_time}
                      </span>
                    )}
                    {task.reminder_time && <span>Remind {task.reminder_time}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(task);
                      setFormOpen(true);
                    }}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-text"
                    aria-label="Edit task"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => void removeTask(task.id)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} task={editing} onSaved={() => void refetch()} />
    </div>
  );
}