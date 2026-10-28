const DAY_MS = 24 * 60 * 60 * 1000;

export function toISODateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function addMonths(d: Date, n: number): Date {
  const c = new Date(d);
  c.setMonth(c.getMonth() + n);
  return c;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isOverdue(task: { status: string; due_date?: string | null }): boolean {
  if (task.status === 'done') return false;
  if (!task.due_date) return false;
  const due = startOfDay(new Date(task.due_date + 'T00:00:00'));
  return due.getTime() < startOfDay(new Date()).getTime();
}

export function taskDueDate(task: { due_date?: string | null }): Date | null {
  if (!task.due_date) return null;
  const d = new Date(task.due_date + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function taskDueTime(task: { due_date?: string | null; due_time?: string | null }): Date | null {
  if (!task.due_date) return null;
  const time = task.due_time || '00:00';
  const [h, m] = time.split(':').map(Number);
  const d = new Date(task.due_date + 'T' + String(h || 0).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ':00');
  return isNaN(d.getTime()) ? null : d;
}

export function formatDayLabel(d: Date): string {
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, addDays(now, -1))) return 'Yesterday';
  if (isSameDay(d, addDays(now, 1))) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function getWeekStart(d: Date): Date {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday-first
  const start = startOfDay(d);
  start.setDate(start.getDate() - diff);
  return start;
}

export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = getWeekStart(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

export function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  const now = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(now, -i));
  }
  return out;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function combineDateTime(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h = 0, min = 0] = (time || '00:00').split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, h, min, 0, 0);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}
