'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTasks } from '@/lib/hooks/use-entities';
import { getMonthGrid, getWeekStart, addMonths, addDays, isSameDay, startOfDay } from '@/lib/utils/dates';
import { tasksForDateKey } from '@/lib/utils/stats';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Task } from '@/lib/types';

type View = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks(user?.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-xl border border-line p-2 text-text transition-colors hover:bg-raised" aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-xl border border-line px-3 py-2 text-sm text-text transition-colors hover:bg-raised"
          >
            Today
          </button>
          <button onClick={() => shift(1)} className="rounded-xl border border-line p-2 text-text transition-colors hover:bg-raised" aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(['month', 'week', 'day'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? 'border-transparent bg-text text-ink' : 'border-line text-muted hover:bg-raised hover:text-text'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {view === 'month' ? (
            <h2 className="text-xl font-semibold">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
          ) : view === 'week' ? (
            <h2 className="text-xl font-semibold">
              {getWeekStart(cursor).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} —{' '}
              {addDays(getWeekStart(cursor), 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
          ) : (
            <h2 className="text-xl font-semibold">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading calendar…</p>
      ) : view === 'month' ? (
        <Card className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted">
                {d}
              </div>
            ))}
            {monthGrid.map((d) => {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const dayTaskList = tasksByDateKey(key);
              const inMonth = d.getMonth() === month;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setCursor(d);
                    setView('day');
                  }}
                  className={`min-h-[84px] rounded-xl border p-2 text-left transition-colors ${
                    isSameDay(d, new Date()) ? 'border-text/40 bg-raised' : 'border-line bg-ink hover:bg-raised'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <p className="text-xs font-medium text-muted">{d.getDate()}</p>
                  <div className="mt-1 space-y-1">
                    {dayTaskList.slice(0, 3).map((t) => (
                      <div key={t.id} className="truncate rounded bg-surface px-1.5 py-0.5 text-[11px] text-text">
                        {t.title}
                      </div>
                    ))}
                    {dayTaskList.length > 3 && <p className="text-[11px] text-muted">+{dayTaskList.length - 3} more</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : view === 'week' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {weekDays.map((d) => {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayTaskList = tasksByDateKey(key);
            return (
              <Card key={key} className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{d.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                <p className="mt-1 text-lg font-semibold">{d.toLocaleDateString(undefined, { day: 'numeric' })}</p>
                <div className="mt-3 space-y-2">
                  {dayTaskList.length === 0 && <p className="text-sm text-muted">No tasks</p>}
                  {dayTaskList.map((t) => (
                    <div key={t.id} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                      <p className="truncate">{t.title}</p>
                      <Badge tone={t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low'}>{t.priority}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tasks on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <a href="/app/tasks?new=1">
              <button className="inline-flex items-center gap-2 rounded-xl bg-text px-4 py-2 text-sm font-medium text-ink">
                <Plus size={16} /> New task
              </button>
            </a>
          </div>
          <div className="mt-4 space-y-2">
            {dayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Nothing scheduled for this day.</p>
            ) : (
              dayTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3">
                  <span className="truncate text-sm">{t.title}</span>
                  <Badge tone={t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low'}>{t.priority}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
