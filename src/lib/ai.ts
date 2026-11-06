import { createClient } from '@/lib/supabase/client';

export type AiActionType = 'create_task' | 'update_task' | 'complete_task' | 'create_habit';
export type AiActionStatus = 'pending' | 'applied' | 'cancelled' | 'failed';

export interface AiActionProposal {
  id: string;
  type: AiActionType;
  payload: Record<string, unknown>;
  label: string;
  status: AiActionStatus;
}

export interface AiConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: { actions?: AiActionProposal[] } & Record<string, unknown>;
  created_at: string;
}

interface StreamCallbacks {
  onMeta?: (data: { conversationId: string; title: string }) => void;
  onDelta?: (text: string) => void;
  onActions?: (data: { messageId: string; actions: AiActionProposal[] }) => void;
  onDone?: (data: { conversationId: string; messageId: string; title: string }) => void;
}

function functionsUrl(name: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
  } catch {
    // ignore
  }
  if (response.status === 404) {
    return 'Veyro AI backend is not deployed yet. Deploy the ai-chat function to your Supabase project.';
  }
  return `Veyro AI request failed (${response.status}). Please try again.`;
}

export function localTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function streamAiChat(
  input: { conversationId?: string | null; message: string; retry?: boolean },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(functionsUrl('ai-chat'), {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      conversationId: input.conversationId ?? undefined,
      message: input.message,
      retry: input.retry === true,
      today: localTodayKey(),
      timeZone: localTimeZone(),
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
  if (!response.body) {
    throw new Error('The AI response could not be read. Please try again.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneReceived = false;

  const dispatch = (block: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    let data: any;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }

    if (event === 'meta') callbacks.onMeta?.(data);
    else if (event === 'delta' && typeof data.text === 'string') callbacks.onDelta?.(data.text);
    else if (event === 'actions' && Array.isArray(data.actions)) {
      callbacks.onActions?.({ messageId: data.messageId, actions: data.actions });
    } else if (event === 'done') {
      doneReceived = true;
      callbacks.onDone?.(data);
    } else if (event === 'error') {
      throw new Error(typeof data.message === 'string' ? data.message : 'Veyro AI could not answer.');
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        if (block.trim()) dispatch(block);
      }
    }
    if (buffer.trim()) dispatch(buffer);
    if (!doneReceived) {
      throw new Error('The AI connection closed before finishing. Please try again.');
    }
  } finally {
    reader.releaseLock();
  }
}

export async function executeAiAction(action: Pick<AiActionProposal, 'type' | 'payload'>): Promise<unknown> {
  const headers = await authHeaders();
  const response = await fetch(functionsUrl('ai-actions'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: action.type, payload: action.payload }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const data = await response.json();
  return data?.result;
}

export async function fetchConversations(): Promise<AiConversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id,title,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AiConversation[];
}

export async function fetchConversationMessages(conversationId: string): Promise<AiMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_messages')
    .select('id,conversation_id,role,content,metadata,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as AiMessage[]).map((message) => ({
    ...message,
    metadata: message.metadata ?? {},
  }));
}

export async function saveMessageActions(messageId: string, actions: AiActionProposal[]): Promise<void> {
  const supabase = createClient();
  const { data: current, error: readError } = await supabase
    .from('ai_messages')
    .select('metadata')
    .eq('id', messageId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const metadata = { ...(current?.metadata ?? {}), actions };
  const { error } = await supabase.from('ai_messages').update({ metadata }).eq('id', messageId);
  if (error) throw new Error(error.message);
}

export function actionDetails(action: AiActionProposal): string[] {
  const payload = action.payload;
  if (action.type === 'create_task' || action.type === 'update_task') {
    const details: string[] = [];
    if (typeof payload.priority === 'string') details.push(`Priority: ${payload.priority}`);
    if (typeof payload.due_date === 'string') {
      details.push(`Due: ${payload.due_date}${typeof payload.due_time === 'string' ? ` at ${payload.due_time}` : ''}`);
    } else if (payload.due_date === null) {
      details.push('Due date: cleared');
    }
    if (typeof payload.status === 'string') details.push(`Status: ${payload.status.replace('_', ' ')}`);
    if (typeof payload.description === 'string' && payload.description.trim()) {
      details.push(payload.description.trim());
    }
    return details;
  }
  if (action.type === 'create_habit') {
    const details: string[] = [];
    if (typeof payload.frequency === 'string') details.push(`Frequency: ${payload.frequency}`);
    if (typeof payload.target_days === 'number') details.push(`Target: ${payload.target_days} days`);
    if (typeof payload.description === 'string' && payload.description.trim()) {
      details.push(payload.description.trim());
    }
    return details;
  }
  return [];
}
