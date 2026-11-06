'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { updateTask, createTask } from '@/lib/db';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { toISODateKey } from '@/lib/utils/dates';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onSaved: () => void;
}

export default function TaskFormModal({ open, onClose, task, onSaved }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setPriority(task?.priority ?? 'medium');
      setStatus(task?.status ?? 'todo');
      setDueDate(task?.due_date ?? toISODateKey(new Date()));
      setDueTime(task?.due_time ?? '09:00');
      setReminderEnabled(task ? Boolean(task.reminder_time) : true);
      if (task?.reminder_time) {
        const date = new Date(task.reminder_time);
        setReminderTime(
          isNaN(date.getTime())
            ? '09:00'
            : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        );
      } else {
        setReminderTime('09:00');
      }
      setSaving(false);
      setError(null);
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const reminderAt = `${dueDate || toISODateKey(new Date())}T${reminderTime || '09:00'}:00`;
      const reminderIso = reminderEnabled ? new Date(reminderAt).toISOString() : null;
      if (task) {
        const updates: Record<string, unknown> = {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          due_date: dueDate || null,
          due_time: dueTime || null,
          reminder_time: reminderIso,
        };
        await updateTask(task.id, updates as Partial<Task>);
      } else {
        const userId = user?.id;
        if (!userId) {
          setError('You must be signed in.');
          return;
        }
        await createTask(userId, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          reminder_time: reminderIso,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context, links, notes�" rows={3} />
        </div>
        <div className={cn('grid gap-4', task && 'sm:grid-cols-2')}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          {task && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Due time</label>
            <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </div>
        <div className="rounded-xl border border-line/70 bg-raised/30 px-3.5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Time reminder</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {reminderEnabled ? 'A browser alert will be sent at this time.' : 'No reminder will be sent for this task.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              aria-label="Toggle time reminder"
              onClick={() => setReminderEnabled((value) => !value)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
                reminderEnabled ? 'border-accent bg-accent' : 'border-line bg-raised'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 rounded-full shadow-soft transition-all duration-200',
                  reminderEnabled ? 'left-[22px] bg-accent-contrast' : 'left-0.5 bg-muted'
                )}
                style={{ height: 18, width: 18 }}
              />
            </button>
          </div>
          {reminderEnabled && (
            <div className="mt-3">
              <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? (task ? 'Saving...' : 'Creating...') : task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
