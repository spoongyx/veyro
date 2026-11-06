export type AiActionType = 'create_task' | 'update_task' | 'complete_task' | 'create_habit';
export type AiActionStatus = 'pending' | 'applied' | 'cancelled' | 'failed';

export interface AiActionProposal {
  id: string;
  type: AiActionType;
  payload: Record<string, unknown>;
  label: string;
  status: AiActionStatus;
}

export interface NormalizedAction {
  type: AiActionType;
  payload: Record<string, unknown>;
  label: string;
}

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'Propose creating a task. Only use when the user explicitly asks to add or create a task. The user must confirm before it is saved.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short task title (max 200 chars).' },
          description: { type: 'string', description: 'Optional details or notes.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format (user local date).' },
          due_time: { type: 'string', description: 'Due time in 24h HH:MM format.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description:
        'Propose editing an existing task. Only use when the user explicitly asks to change a task. The user must confirm before it is saved.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'UUID of the task from the provided context.' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
          due_date: { type: 'string', description: 'YYYY-MM-DD, or null to clear.' },
          due_time: { type: 'string', description: 'HH:MM, or null to clear.' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description:
        'Propose marking a task as completed. Only use when the user explicitly asks. The user must confirm first.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'UUID of the task from the provided context.' },
          title: { type: 'string', description: 'Task title for display.' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description:
        'Propose creating a habit. Only use when the user explicitly asks to add a habit. The user must confirm first.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Habit name (max 100 chars).' },
          description: { type: 'string' },
          frequency: { type: 'string', enum: ['daily', 'weekly'] },
          target_days: { type: 'integer', description: 'Weekly target days (1-7).' },
          color: { type: 'string', description: 'Hex color like #FF8A32.' },
        },
        required: ['name'],
      },
    },
  },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function optionalStr(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function uuid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return UUID_RE.test(value) ? value : null;
}

function dateOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return typeof value === 'string' && DATE_RE.test(value) ? value : undefined;
}

function timeOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return typeof value === 'string' && TIME_RE.test(value) ? value : undefined;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function normalizeAction(type: string, raw: unknown): { action?: NormalizedAction; error?: string } {
  let payload: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { error: 'Action payload must be an object.' };
      }
      payload = parsed as Record<string, unknown>;
    } catch {
      return { error: 'Action payload was not valid JSON.' };
    }
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    payload = raw as Record<string, unknown>;
  } else {
    return { error: 'Action payload must be an object.' };
  }

  switch (type) {
    case 'create_task': {
      const title = str(payload.title, 200);
      if (!title) return { error: 'A task title is required.' };
      const description = optionalStr(payload.description, 1200) ?? null;
      const priority = enumValue(payload.priority, ['low', 'medium', 'high'] as const, 'medium');
      const dueDate = dateOrNull(payload.due_date) ?? null;
      const dueTime = timeOrNull(payload.due_time) ?? null;
      const clean = { title, description, priority, due_date: dueDate, due_time: dueTime };
      const suffix = dueDate ? ` for ${dueDate}${dueTime ? ` at ${dueTime}` : ''}` : '';
      return { action: { type, payload: clean, label: `Create task "${title}"${suffix}` } };
    }

    case 'update_task': {
      const taskId = uuid(payload.task_id);
      if (!taskId) return { error: 'A valid task id is required.' };
      const clean: Record<string, unknown> = {};
      const title = optionalStr(payload.title, 200);
      if (title !== undefined) {
        if (!title) return { error: 'Task title cannot be empty.' };
        clean.title = title;
      }
      const description = optionalStr(payload.description, 1200);
      if (description !== undefined) clean.description = description;
      if (payload.priority !== undefined) {
        clean.priority = enumValue(payload.priority, ['low', 'medium', 'high'] as const, 'medium');
      }
      if (payload.status !== undefined) {
        clean.status = enumValue(payload.status, ['todo', 'in_progress', 'done'] as const, 'todo');
      }
      const dueDate = dateOrNull(payload.due_date);
      if (dueDate !== undefined) clean.due_date = dueDate;
      const dueTime = timeOrNull(payload.due_time);
      if (dueTime !== undefined) clean.due_time = dueTime;
      if (!Object.keys(clean).length) return { error: 'No task changes were provided.' };
      const label = title ? `Update task "${title}"` : 'Update task';
      return { action: { type, payload: { task_id: taskId, ...clean }, label } };
    }

    case 'complete_task': {
      const taskId = uuid(payload.task_id);
      if (!taskId) return { error: 'A valid task id is required.' };
      const title = str(payload.title, 200);
      return {
        action: {
          type,
          payload: { task_id: taskId, ...(title ? { title } : {}) },
          label: title ? `Mark "${title}" as complete` : 'Mark task as complete',
        },
      };
    }

    case 'create_habit': {
      const name = str(payload.name, 100);
      if (!name) return { error: 'A habit name is required.' };
      const description = optionalStr(payload.description, 1000) ?? null;
      const frequency = enumValue(payload.frequency, ['daily', 'weekly'] as const, 'daily');
      const rawTarget = typeof payload.target_days === 'number' ? Math.round(payload.target_days) : 7;
      const targetDays = Math.min(7, Math.max(1, rawTarget));
      const color =
        typeof payload.color === 'string' && COLOR_RE.test(payload.color) ? payload.color : '#FF8A32';
      return {
        action: {
          type,
          payload: { name, description, frequency, target_days: targetDays, color },
          label: `Create habit "${name}"`,
        },
      };
    }

    default:
      return { error: `Unsupported action: ${type}` };
  }
}
