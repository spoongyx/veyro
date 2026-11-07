'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CalendarDays,
  CheckSquare,
  CircleCheck,
  Flame,
  History,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Button, Card, IconButton, Modal } from '@/components/ui';
import { useToast } from '@/components/toast';
import { cn } from '@/lib/utils/cn';
import {
  actionDetails,
  deleteAiConversation,
  executeAiAction,
  fetchConversationMessages,
  fetchConversations,
  saveMessageActions,
  streamAiChat,
  type AiActionProposal,
  type AiConversation,
  type AiMessage,
} from '@/lib/ai';

const SUGGESTIONS = [
  { icon: Target, title: 'Plan my day', prompt: 'Plan my day around my current tasks and deadlines.' },
  { icon: CheckSquare, title: 'What should I focus on?', prompt: 'What should I focus on today, considering my tasks, habits, and goals?' },
  { icon: CalendarDays, title: 'Review my week', prompt: 'Review my last 7 days of tasks, habits, and focus time.' },
  { icon: Flame, title: 'Create a habit', prompt: 'Create a daily habit to read for 20 minutes.' },
];

const ACTION_META: Record<AiActionProposal['type'], { icon: typeof Plus; className: string }> = {
  create_task: { icon: Plus, className: 'text-accent' },
  update_task: { icon: RefreshCw, className: 'text-accent' },
  complete_task: { icon: CircleCheck, className: 'text-success' },
  create_habit: { icon: Flame, className: 'text-accent' },
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-6 [&>p]:mb-0">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className="font-mono text-[12px] leading-6">{children}</code>
    ) : (
      <code className="rounded-md bg-raised px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-xl border border-line/70 bg-card p-3 text-xs last:mb-0">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-2.5 text-sm font-semibold first:mt-0">{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-accent/40 pl-3 text-muted last:mb-0">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-2 py-1.5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-line/60 px-2 py-1.5 align-top">{children}</td>,
  hr: () => <hr className="my-3 border-line" />,
};

function friendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  if (/could not find the table|relation .* does not exist|schema cache/i.test(raw)) {
    return 'Veyro AI is not set up yet: its database tables are missing. Run the AI migration in Supabase, then reload this page.';
  }
  if (raw === 'Failed to fetch' || raw.includes('NetworkError')) {
    return 'Could not reach Veyro AI. Check your connection and try again.';
  }
  return raw;
}

function formatDay(value: string): string {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

function ConversationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        size={13}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search conversations"
        aria-label="Search conversations"
        className="h-8 w-full rounded-lg border border-line/70 bg-card/60 pl-8 pr-8 text-xs text-text outline-none transition-colors placeholder:text-muted/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text"
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}

function ConversationList({
  conversations,
  activeId,
  loading,
  query,
  onSelect,
  onDelete,
  className,
}: {
  conversations: AiConversation[];
  activeId: string | null;
  loading: boolean;
  query?: string;
  onSelect: (id: string) => void;
  onDelete: (conversation: AiConversation) => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[0, 1, 2].map((item) => (
          <div key={item} className="skeleton h-9 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    const searching = Boolean(query?.trim());
    return (
      <p className={cn('px-2 py-6 text-center text-xs leading-5 text-muted', className)}>
        {searching ? 'No conversations match your search.' : 'No conversations yet.'}
        {searching ? null : (
          <>
            <br />
            Start a new chat to begin.
          </>
        )}
      </p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <div
            key={conversation.id}
            className={cn(
              'group flex items-center gap-1 rounded-lg pr-1 transition-colors',
              active ? 'bg-accent/10' : 'hover:bg-raised/70'
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                active ? 'text-accent' : 'text-muted hover:text-text'
              )}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{conversation.title}</span>
            </button>
            <span className="shrink-0 text-[10px] text-muted">{formatDay(conversation.updated_at)}</span>
            <button
              type="button"
              onClick={() => onDelete(conversation)}
              aria-label={`Delete ${conversation.title}`}
              title="Delete conversation"
              className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted/70 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({
  action,
  onConfirm,
  onCancel,
}: {
  action: AiActionProposal;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const meta = ACTION_META[action.type];
  const details = actionDetails(action);
  const done = action.status !== 'pending';

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        action.status === 'applied'
          ? 'border-success/25 bg-success/5'
          : action.status === 'cancelled'
            ? 'border-line bg-surface/60 opacity-70'
            : 'border-accent/25 bg-accent-soft/60'
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/60 bg-card',
            meta.className
          )}
        >
          <meta.icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-5 text-text">{action.label}</p>
          {details.length ? (
            <p className="mt-0.5 text-[11px] leading-5 text-muted">{details.join(' · ')}</p>
          ) : null}
          {done ? (
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold',
                action.status === 'applied' ? 'text-success' : 'text-muted'
              )}
            >
              {action.status === 'applied' ? (
                <>
                  <CircleCheck size={12} />
                  Applied
                </>
              ) : (
                'Dismissed'
              )}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={busy}
                className="h-7 px-2.5 text-[11px]"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onConfirm();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                className="h-7 px-2.5 text-[11px]"
                onClick={onCancel}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  onAction,
}: {
  message: AiMessage;
  onAction: (message: AiMessage, action: AiActionProposal, decision: 'apply' | 'cancel') => Promise<void>;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-6 text-accent-contrast shadow-soft sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    );
  }

  const actions = message.metadata.actions ?? [];

  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
        <Sparkles size={15} />
      </span>
      <div className="min-w-0 flex-1 sm:max-w-[85%]">
        <div className="rounded-2xl rounded-tl-md border border-line/70 bg-surface/70 px-4 py-3 text-sm leading-7 text-text">
          <Markdown content={message.content} />
        </div>
        {actions.length ? (
          <div className="mt-2 space-y-2">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onConfirm={() => onAction(message, action, 'apply')}
                onCancel={() => void onAction(message, action, 'cancel')}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
        <Sparkles size={15} className={content ? undefined : 'animate-pulse'} />
      </span>
      <div className="min-w-0 rounded-2xl rounded-tl-md border border-line/70 bg-surface/70 px-4 py-3 text-sm leading-7 sm:max-w-[85%]">
        {content ? (
          <>
            <Markdown content={content} />
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse rounded-full bg-accent align-middle" />
          </>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/70" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/70 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/70 [animation-delay:240ms]" />
            </span>
            Thinking about your workspace…
          </span>
        )}
      </div>
    </div>
  );
}

export default function AiPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const normalizedQuery = conversationQuery.trim().toLowerCase();
  const visibleConversations = normalizedQuery
    ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(normalizedQuery))
    : conversations;

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const loadIdRef = useRef(0);
  const sendingRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const accumulatedActionsRef = useRef<AiActionProposal[]>([]);

  const loadConversations = useCallback(async () => {
    try {
      const items = await fetchConversations();
      setConversations(items);
      setSetupMessage(null);
    } catch (err) {
      setSetupMessage(friendlyError(err));
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: sendingRef.current ? 'auto' : 'smooth' });
  }, [messages, streamingContent, error]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [input]);

  const runChat = useCallback(
    async (rawMessage: string, isRetry = false) => {
      const text = rawMessage.trim();
      if (!text || sendingRef.current) return;

      if (!isRetry) {
        const optimistic: AiMessage = {
          id: `local-${Date.now()}`,
          conversation_id: activeConversationId ?? 'new',
          role: 'user',
          content: text,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput('');
      }

      sendingRef.current = true;
      setSending(true);
      setError(null);
      setRetryMessage(null);
      setStreamingContent('');
      accumulatedTextRef.current = '';
      accumulatedActionsRef.current = [];

      const runId = ++runIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAiChat(
          {
            conversationId: activeConversationId,
            message: text,
            retry: isRetry,
          },
          {
            onMeta: (data) => {
              if (runId !== runIdRef.current) return;
              setActiveConversationId(data.conversationId);
            },
            onDelta: (delta) => {
              if (runId !== runIdRef.current) return;
              accumulatedTextRef.current += delta;
              setStreamingContent(accumulatedTextRef.current);
            },
            onActions: (data) => {
              if (runId !== runIdRef.current) return;
              accumulatedActionsRef.current = data.actions;
            },
            onDone: (data) => {
              if (runId !== runIdRef.current) return;
              const assistant: AiMessage = {
                id: data.messageId,
                conversation_id: data.conversationId,
                role: 'assistant',
                content: accumulatedTextRef.current,
                metadata: { actions: accumulatedActionsRef.current },
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistant]);
              setStreamingContent(null);
              setActiveConversationId(data.conversationId);
              void loadConversations();
            },
          },
          controller.signal
        );
      } catch (err) {
        if (runId !== runIdRef.current) return;
        const aborted =
          err instanceof DOMException
            ? err.name === 'AbortError'
            : err instanceof Error && err.name === 'AbortError';
        setStreamingContent(null);
        if (!aborted) {
          setError(friendlyError(err));
          setRetryMessage(text);
        }
      } finally {
        if (runId === runIdRef.current) {
          sendingRef.current = false;
          setSending(false);
          abortRef.current = null;
        }
      }
    },
    [activeConversationId, loadConversations]
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    runIdRef.current += 1;
    loadIdRef.current += 1;
    sendingRef.current = false;
    setSending(false);
    setStreamingContent(null);
    setError(null);
    setRetryMessage(null);
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setHistoryOpen(false);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    runIdRef.current += 1;
    const loadId = ++loadIdRef.current;
    sendingRef.current = false;
    setSending(false);
    setStreamingContent(null);
    setError(null);
    setRetryMessage(null);
    setHistoryOpen(false);
    setActiveConversationId(id);
    setLoadingMessages(true);
    try {
      const items = await fetchConversationMessages(id);
      if (loadId === loadIdRef.current) setMessages(items);
    } catch (err) {
      if (loadId === loadIdRef.current) {
        setMessages([]);
        setError(friendlyError(err));
      }
    } finally {
      if (loadId === loadIdRef.current) setLoadingMessages(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreamingContent(null);
    sendingRef.current = false;
    setSending(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteAiConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (activeConversationId === deleteTarget.id) {
        startNewChat();
      }
      toast('Conversation deleted', {
        description: 'The chat and its messages were permanently removed.',
        tone: 'success',
      });
      setDeleteTarget(null);
    } catch (err) {
      toast('Could not delete conversation', { description: friendlyError(err), tone: 'error' });
    } finally {
      setDeleting(false);
    }
  }, [activeConversationId, deleteTarget, deleting, startNewChat, toast]);

  const handleAction = useCallback(
    async (message: AiMessage, action: AiActionProposal, decision: 'apply' | 'cancel') => {
      const current = message.metadata.actions ?? [];

      if (decision === 'cancel') {
        const next = current.map((item) =>
          item.id === action.id ? { ...item, status: 'cancelled' as const } : item
        );
        setMessages((prev) =>
          prev.map((item) =>
            item.id === message.id ? { ...item, metadata: { ...item.metadata, actions: next } } : item
          )
        );
        try {
          await saveMessageActions(message.id, next);
        } catch (err) {
          toast('Could not save that choice', { description: friendlyError(err), tone: 'error' });
        }
        return;
      }

      try {
        await executeAiAction(action);
        const next = current.map((item) =>
          item.id === action.id ? { ...item, status: 'applied' as const } : item
        );
        setMessages((prev) =>
          prev.map((item) =>
            item.id === message.id ? { ...item, metadata: { ...item.metadata, actions: next } } : item
          )
        );
        toast(
          action.type === 'create_habit'
            ? 'Habit created'
            : action.type === 'create_task'
              ? 'Task created'
              : 'Task updated',
          { description: 'Your workspace has been updated.', tone: 'success' }
        );
        void saveMessageActions(message.id, next).catch(() => undefined);
      } catch (err) {
        toast('Could not apply that action', { description: friendlyError(err), tone: 'error' });
      }
    },
    [toast]
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void runChat(input);
    },
    [input, runChat]
  );

  const onComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void runChat(input);
      }
    },
    [input, runChat]
  );

  const showEmpty = !loadingMessages && messages.length === 0 && streamingContent === null;

  return (
    <>
      <Card
        variant="elevated"
        className="flex h-[calc(100dvh-15rem)] min-h-[460px] flex-col overflow-hidden p-0 lg:h-[calc(100vh-10rem)]"
      >
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-line/70 bg-surface/40 lg:flex xl:w-64">
            <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Conversations
              </p>
              <IconButton
                className="h-7 w-7 rounded-lg"
                onClick={startNewChat}
                aria-label="New chat"
                title="New chat"
              >
                <Plus size={14} />
              </IconButton>
            </div>
            <div className="border-b border-line/70 px-2.5 py-2">
              <ConversationSearch value={conversationQuery} onChange={setConversationQuery} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <ConversationList
                conversations={visibleConversations}
                activeId={activeConversationId}
                loading={conversationsLoading}
                query={conversationQuery}
                onSelect={(id) => void openConversation(id)}
                onDelete={(conversation) => setDeleteTarget(conversation)}
              />
            </div>
            <div className="border-t border-line/70 p-3">
              <p className="text-[10px] leading-4 text-muted">
                Veyro AI only sees your own workspace data and asks before making changes.
              </p>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-contrast shadow-[0_0_24px_-8px_rgb(var(--accent)/0.9)]">
                  <Sparkles size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-text">Veyro AI</p>
                  <p className="hidden truncate text-[11px] text-muted sm:block">
                    Context-aware assistant for your tasks, habits and goals
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Context-aware
                </span>
                <IconButton
                  className="lg:hidden"
                  onClick={() => setHistoryOpen(true)}
                  aria-label="Conversation history"
                  title="Conversation history"
                >
                  <History size={16} />
                </IconButton>
                <IconButton onClick={startNewChat} aria-label="New chat" title="New chat">
                  <Plus size={16} />
                </IconButton>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loadingMessages ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-xs text-muted">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  Loading conversation…
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {showEmpty ? (
                    <div className="flex flex-col items-center px-1 py-6 text-center sm:py-10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent shadow-[0_0_40px_-16px_rgb(var(--accent)/0.8)]">
                        <Sparkles size={26} />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold tracking-tight text-text">
                        How can I help you today?
                      </h2>
                      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
                        Ask about your day, plan your week, or create tasks and habits. I use your live
                        Veyro data and ask before changing anything.
                      </p>

                      {setupMessage ? (
                        <div className="mt-6 flex w-full max-w-md items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-left">
                          <TriangleAlert size={17} className="mt-0.5 shrink-0 text-warning" />
                          <p className="text-xs leading-5 text-text">{setupMessage}</p>
                        </div>
                      ) : (
                        <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                          {SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion.title}
                              type="button"
                              onClick={() => void runChat(suggestion.prompt)}
                              className="group flex items-start gap-3 rounded-xl border border-line/70 bg-surface/60 p-3 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent-soft/40"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/60 bg-card text-accent transition-transform duration-200 group-hover:scale-105">
                                <suggestion.icon size={15} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold text-text">
                                  {suggestion.title}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                                  {suggestion.prompt}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessage key={message.id} message={message} onAction={handleAction} />
                    ))
                  )}

                  {streamingContent !== null ? <StreamingBubble content={streamingContent} /> : null}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {error ? (
              <div className="mx-4 mb-3 flex flex-col gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 sm:mx-6 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2.5">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-xs leading-5 text-danger">{error}</p>
                </div>
                {retryMessage ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 self-start sm:ml-auto sm:self-auto"
                    onClick={() => void runChat(retryMessage, true)}
                  >
                    <RefreshCw size={13} />
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="border-t border-line/70 bg-surface/50 px-3 py-3 sm:px-5 sm:py-4">
              <form
                onSubmit={submit}
                className="flex items-end gap-2 rounded-2xl border border-line bg-card p-1.5 shadow-soft transition-colors focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/15"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  rows={1}
                  maxLength={4000}
                  placeholder="Ask about your tasks, habits or goals…"
                  aria-label="Message Veyro AI"
                  className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-base text-text outline-none placeholder:text-muted/70 sm:text-sm"
                />
                {sending ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    aria-label="Stop generating"
                    title="Stop generating"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-raised text-muted transition-colors hover:text-text"
                  >
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-current" />
                  </button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 w-9 shrink-0 p-0"
                    disabled={!input.trim()}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </Button>
                )}
              </form>
              <p className="mt-2 text-center text-[10px] leading-4 text-muted">
                Veyro AI can propose changes to your workspace. Nothing is saved until you confirm.
              </p>
            </div>
          </section>
        </div>
      </Card>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Conversations"
        description="Pick up where you left off or start fresh."
      >
        <Button variant="secondary" className="w-full" onClick={startNewChat}>
          <Plus size={15} />
          New chat
        </Button>
        <div className="mt-3">
          <ConversationSearch value={conversationQuery} onChange={setConversationQuery} />
        </div>
        <div className="mt-2">
          <ConversationList
            conversations={visibleConversations}
            activeId={activeConversationId}
            loading={conversationsLoading}
            query={conversationQuery}
            onSelect={(id) => void openConversation(id)}
            onDelete={(conversation) => setDeleteTarget(conversation)}
          />
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete conversation?"
        description="This permanently removes the conversation and all of its messages."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void confirmDelete()}>
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        }
      >
        <div className="break-words rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-sm text-text">
          {deleteTarget?.title}
        </div>
        <p className="mt-2.5 text-xs leading-5 text-muted">This action can&apos;t be undone.</p>
      </Modal>
    </>
  );
}
