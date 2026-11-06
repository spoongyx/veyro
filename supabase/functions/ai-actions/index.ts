import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { normalizeAction } from '../_shared/actions.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ error: 'You must be signed in.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: 'Supabase environment is not configured.' }, 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return jsonResponse({ error: 'Your session has expired. Please sign in again.' }, 401);
  }

  let body: { type?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  if (!body.type) {
    return jsonResponse({ error: 'An action type is required.' }, 400);
  }

  const normalized = normalizeAction(body.type, body.payload);
  if (!normalized.action) {
    return jsonResponse({ error: normalized.error ?? 'Invalid action.' }, 400);
  }

  const action = normalized.action;

  try {
    if (action.type === 'create_task') {
      const payload = action.payload;
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          due_date: payload.due_date,
          due_time: payload.due_time,
          status: 'todo',
        })
        .select('id,title,status,priority,due_date,due_time')
        .single();
      if (error || !data) throw error ?? new Error('Task was not created.');
      return jsonResponse({ ok: true, action: normalized.action, result: data });
    }

    if (action.type === 'update_task') {
      const { task_id, ...patch } = action.payload as Record<string, unknown> & { task_id: string };
      if (patch.status === 'done') patch.completed_at = new Date().toISOString();
      else if (patch.status !== undefined) patch.completed_at = null;

      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', task_id)
        .eq('user_id', user.id)
        .select('id,title,status,priority,due_date,due_time,description')
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ error: 'That task no longer exists.' }, 404);
      return jsonResponse({ ok: true, action: normalized.action, result: data });
    }

    if (action.type === 'complete_task') {
      const taskId = action.payload.task_id as string;
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select('id,title,status,completed_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ error: 'That task no longer exists.' }, 404);
      return jsonResponse({ ok: true, action: normalized.action, result: data });
    }

    if (action.type === 'create_habit') {
      const payload = action.payload;
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: payload.name,
          description: payload.description,
          frequency: payload.frequency,
          target_days: payload.target_days,
          color: payload.color,
        })
        .select('id,name,frequency,target_days,color')
        .single();
      if (error || !data) throw error ?? new Error('Habit was not created.');
      return jsonResponse({ ok: true, action: normalized.action, result: data });
    }

    return jsonResponse({ error: 'Unsupported action.' }, 400);
  } catch (error) {
    console.error('AI action failed', action.type, error);
    return jsonResponse(
      { error: action.type === 'create_habit' ? 'Could not create the habit.' : 'Could not update the task.' },
      500
    );
  }
});
