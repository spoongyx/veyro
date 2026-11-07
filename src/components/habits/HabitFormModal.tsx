'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { updateHabit, createHabit } from '@/lib/db';
import type { Habit } from '@/lib/types';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  habit: Habit | null;
  onSaved: () => void;
}

export default function HabitFormModal({ open, onClose, habit, onSaved }: HabitFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FF8A32');
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? '');
      setDescription(habit?.description ?? '');
      setColor(habit?.color ?? '#FF8A32');
      const storedTarget = Math.min(7, Math.max(1, Math.round(Number(habit?.target_days) || 7)));
      setDaysPerWeek(habit ? (habit.frequency === 'daily' ? 7 : storedTarget) : 7);
      setError(null);
    }
  }, [open, habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const userId = user?.id;
      if (!userId) {
        setError('You must be signed in.');
        setSaving(false);
        return;
      }
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        frequency: daysPerWeek >= 7 ? ('daily' as const) : ('weekly' as const),
        target_days: daysPerWeek,
      };
      if (habit) {
        await updateHabit(habit.id, payload);
      } else {
        await createHabit(userId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={habit ? 'Edit habit' : 'New habit'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning meditation" required autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" rows={2} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">How many days per week?</label>
          <Select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <option key={days} value={days}>
                {days === 7 ? '7 days (every day)' : `${days} day${days === 1 ? '' : 's'} per week`}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-muted">
            {daysPerWeek === 7
              ? 'Check in every day to reach 100% each week.'
              : `Check in ${daysPerWeek} time${daysPerWeek === 1 ? '' : 's'} this week to reach 100%.`}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Color</label>
          <div className="flex items-center gap-3">
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-14 cursor-pointer border border-line bg-ink p-1" />
            <span className="text-sm text-muted">{color}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving�' : habit ? 'Save changes' : 'Create habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
