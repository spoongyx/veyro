'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks } from '@/lib/hooks/use-entities';
import { getMonthGrid, getWeekStart, addMonths, addDays, isSameDay, startOfDay } from '@/lib/utils/dates';
import { tasksForDateKey } from '@/lib/utils/stats';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, Card, Reveal } from '@/components/ui';
import type { Task } from '@/lib/types';

type View = 'month' | 'week' | 'day';

function priorityClass(priority: Task['priority']) {
  if (priority === 'high') return 'bg-danger/10 text-danger border-danger/20';
  if (priority === 'medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-raised/70 text-muted border-line/60';
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks(user?.id);
  const router = useRouter();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const weekDays = useMemo(() => {
    const start = getWeekStart(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);
  const selectedDate = view === 'day' ? cursor : startOfDay(cursor);
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayTasks = tasksForDateKey(tasks, selectedKey);

  const shift = (dir: -1 | 1) => {
    if (view === 'month') setCursor(addMonths(cursor, dir));
    else if (view === 'week') setCursor(addDays(getWeekStart(cursor), dir * 7));
    else setCursor(addDays(cursor, dir));
  };

  const tasksByDateKey = (key: string): Task[] => tasksForDateKey(tasks, key);

  const rangeTitle =
    view === 'month'
      ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${getWeekStart(cursor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${addDays(getWeekStart(cursor), 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Calendar</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-text sm:text-3xl">{rangeTitle}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-line/70 bg-card/70 p-1">
            <button
              onClick={() => shift(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
              aria-label="Previous"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-muted transition-colors hover:bg-raised hover:text-text"
            >
              Today
            </button>
            <button
              onClick={() => shift(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
              aria-label="Next"
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-line/70 bg-raised/40 p-1">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold capitalize transition-all',
                  view === v ? 'bg-accent text-accent-contrast shadow-soft' : 'text-muted hover:bg-card hover:text-text'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-[520px] w-full" />
      ) : view === 'month' ? (
        <Reveal>
          <Card className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
                >
                  {d}
                </div>
              ))}
              {monthGrid.map((d) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayTaskList = tasksByDateKey(key);
                const inMonth = d.getMonth() === month;
                const today = isSameDay(d, new Date());
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCursor(d);
                      setView('day');
                    }}
                    className={cn(
                      'group min-h-[86px] rounded-xl border p-2 text-left transition-all duration-200 hover:border-accent/35 hover:bg-raised/60',
                      today ? 'border-accent/50 bg-accent/[0.05]' : 'border-line/50 bg-surface/40',
                      !inMonth && 'opacity-35'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className={cn('text-xs font-semibold tabular-nums', today ? 'text-accent' : 'text-muted')}>
                        {d.getDate()}
                      </p>
                      {dayTaskList.length > 0 ? (
                        <span className="rounded-full bg-raised px-1.5 text-[9px] font-semibold tabular-nums text-muted">
                          {dayTaskList.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {dayTaskList.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            'truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                            priorityClass(t.priority)
                          )}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTaskList.length > 2 && (
                        <p className="px-0.5 text-[10px] text-muted">+{dayTaskList.length - 2} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </Reveal>
      ) : view === 'week' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {weekDays.map((d, index) => {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayTaskList = tasksByDateKey(key);
            const today = isSameDay(d, new Date());
            return (
              <Reveal key={key} delay={index * 40}>
                <Card className={cn('h-full p-4', today && 'border-accent/40 bg-accent/[0.04]')}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={cn('text-lg font-semibold tabular-nums', today ? 'text-accent' : 'text-text')}>
                      {d.toLocaleDateString('en-US', { day: 'numeric' })}
                    </p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayTaskList.length === 0 && <p className="py-4 text-center text-xs text-muted">No tasks</p>}
                    {dayTaskList.map((t) => (
                      <div key={t.id} className="rounded-lg border border-line/60 bg-surface/70 px-2.5 py-2">
                        <p className="truncate text-xs font-medium text-text">{t.title}</p>
                        <span
                          className={cn(
                            'mt-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold capitalize',
                            priorityClass(t.priority)
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <Reveal>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-text">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
              </div>
              <Button size="sm" onClick={() => router.push('/app/tasks?new=1')}>
                <Plus size={15} /> New task
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {dayTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line/70 bg-surface/50 px-4 py-10 text-center text-sm text-muted">
                  Nothing scheduled for this day.
                </p>
              ) : (
                dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-surface/70 px-4 py-3"
                  >
                    <span className="truncate text-sm text-text">{t.title}</span>
                    <Badge tone={t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low'}>
                      {t.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
