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
  const [color, setColor] = useState('#f5f7fb');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [targetDays, setTargetDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? '');
      setDescription(habit?.description ?? '');
      setColor(habit?.color ?? '#f5f7fb');
      setFrequency(habit?.frequency ?? 'daily');
      setTargetDays(habit?.target_days ?? 7);
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
        frequency,
        target_days: frequency === 'weekly' ? targetDays : 7,
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
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning meditation" required autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Frequency</label>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Target days / week</label>
            <Input
              type="number"
              min={1}
              max={7}
              value={frequency === 'weekly' ? targetDays : 7}
              onChange={(e) => setTargetDays(Number(e.target.value) || 7)}
            />
          </div>
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
            {saving ? 'Saving…' : habit ? 'Save changes' : 'Create habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
