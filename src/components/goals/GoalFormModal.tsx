'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { updateGoal, createGoal } from '@/lib/db';
import type { Goal } from '@/lib/types';
import { Button, Input, Modal, Textarea } from '@/components/ui';

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSaved: () => void;
}

export default function GoalFormModal({ open, onClose, goal, onSaved }: GoalFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState(100);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState('%');
  const [deadline, setDeadline] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setTitle(goal?.title ?? '');
      setDescription(goal?.description ?? '');
      setTargetValue(goal?.target_value ?? 100);
      setCurrentValue(goal?.current_value ?? 0);
      setUnit(goal?.unit || '%');
      setDeadline(goal?.deadline ?? '');
      setCompleted(goal?.completed ?? false);
      setError(null);
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
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
        title: title.trim(),
        description: description.trim() || null,
        target_value: Number(targetValue) || 0,
        current_value: Number(currentValue) || 0,
        unit: unit.trim() || '%',
        deadline: deadline || null,
        completed,
      };
      if (goal) {
        await updateGoal(goal.id, payload);
      } else {
        await createGoal(userId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run a marathon" required autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional context" rows={2} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Target</label>
            <Input type="number" min={0} value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current</label>
            <Input type="number" min={0} value={currentValue} onChange={(e) => setCurrentValue(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Unit</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Deadline</label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="h-4 w-4 accent-current" />
          <span>Goal completed</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? 'Saving�' : goal ? 'Save changes' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
