'use client';

import { useEffect, useMemo, useState } from 'react';
import { Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useFocusSessions } from '@/lib/hooks/use-entities';
import { showAppNotification } from '@/lib/notifications';
import { focusMinutesSeries, totalFocusMinutes } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils/cn';
import { Card, EmptyState, Reveal, SectionHeading, StatCard } from '@/components/ui';
import { BarChart } from '@/components/charts';

type Phase = 'work' | 'short_break' | 'long_break';

const PHASE_SECONDS: Record<Phase, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PHASE_LABEL: Record<Phase, string> = {
  work: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusPage() {
  const { user } = useAuth();
  const { sessions, addSession } = useFocusSessions(user?.id);
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(PHASE_SECONDS.work);
  const [running, setRunning] = useState(false);
  const [workCount, setWorkCount] = useState(0);

  const phaseSeconds = PHASE_SECONDS[phase];
  const focusSeries = useMemo(() => focusMinutesSeries(sessions, 14), [sessions]);
  const totalMinutes = useMemo(() => totalFocusMinutes(sessions), [sessions]);
  const completedSessions = useMemo(() => sessions.filter((session) => session.completed), [sessions]);

  const focusMinutesToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions
      .filter((session) => session.completed && new Date(session.created_at) >= start)
      .reduce((sum, session) => sum + session.duration_minutes, 0);
  }, [sessions]);

  const sessionsToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return completedSessions.filter((session) => new Date(session.created_at) >= start).length;
  }, [completedSessions]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    handleComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  const handleComplete = () => {
    setRunning(false);
    if (phase === 'work') {
      const nextWorkCount = workCount + 1;
      setWorkCount(nextWorkCount);
      void addSession(25, 'pomodoro', true);
      const nextPhase: Phase = nextWorkCount % 4 === 0 ? 'long_break' : 'short_break';
      setPhase(nextPhase);
      setSecondsLeft(PHASE_SECONDS[nextPhase]);
      void showAppNotification('Focus session complete', {
        body: 'Great work - take a well-deserved break.',
        tag: 'pomodoro-complete',
      });
    } else {
      if (phase === 'long_break') setWorkCount(0);
      setPhase('work');
      setSecondsLeft(PHASE_SECONDS.work);
      void showAppNotification('Break over', { body: 'Time to get back into focus.', tag: 'break-complete' });
    }
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(PHASE_SECONDS[phase]);
  };

  const switchPhase = (next: Phase) => {
    setRunning(false);
    setPhase(next);
    setSecondsLeft(PHASE_SECONDS[next]);
  };

  const skip = () => {
    handleComplete();
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - secondsLeft / phaseSeconds);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal delay={0}>
          <StatCard
            label="Today"
            value={`${focusMinutesToday}m`}
            sub={`${sessionsToday} sessions`}
            icon={<Timer size={16} />}
            tone="accent"
          />
        </Reveal>
        <Reveal delay={60}>
          <StatCard
            label="Sessions"
            value={completedSessions.length}
            sub="completed all time"
            icon={<Timer size={16} />}
            tone="success"
          />
        </Reveal>
        <Reveal delay={120}>
          <StatCard
            label="Deep work"
            value={`${Math.round(totalMinutes / 60)}h`}
            sub="total focused time"
            icon={<Timer size={16} />}
            tone="accent"
          />
        </Reveal>
        <Reveal delay={180}>
          <StatCard
            label="This cycle"
            value={workCount}
            sub="pomodoros before a long break"
            icon={<Coffee size={16} />}
            tone="warning"
          />
        </Reveal>
      </div>

      <Reveal delay={80}>
        <Card className="overflow-hidden p-0">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative flex flex-col items-center justify-center px-6 py-10">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgb(var(--accent)/0.1),transparent_65%)]"
              />
              <div className="relative inline-flex items-center gap-1 rounded-full border border-line/70 bg-raised/50 p-1">
                {(['work', 'short_break', 'long_break'] as Phase[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => switchPhase(value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all',
                      phase === value
                        ? 'bg-accent text-accent-contrast shadow-soft'
                        : 'text-muted hover:text-text'
                    )}
                  >
                    {PHASE_LABEL[value]}
                  </button>
                ))}
              </div>

              <div className="relative mt-5 h-64 w-64">
                <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90">
                  <circle cx="140" cy="140" r={radius} fill="none" stroke="rgb(var(--raised))" strokeWidth="10" />
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke="rgb(var(--accent))"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>
                <div
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-10 rounded-full bg-accent/[0.06] blur-2xl transition-opacity duration-700',
                    running ? 'opacity-100' : 'opacity-40'
                  )}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-5xl font-semibold tabular-nums tracking-[-0.05em] text-text sm:text-[56px]">
                    {formatClock(secondsLeft)}
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    {Math.round(phaseSeconds / 60)} minute {phase === 'work' ? 'session' : 'break'}
                  </p>
                  {running ? (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                      <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-accent" />
                      In focus
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative mt-7 flex items-center justify-center gap-3">
                <button
                  onClick={reset}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-muted transition-all hover:border-accent/25 hover:text-text"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={19} />
                </button>
                <button
                  onClick={() => setRunning((value) => !value)}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-[0_0_40px_-10px_rgb(var(--accent)/0.9)] transition-all duration-200 hover:scale-105 hover:bg-accent-strong active:scale-95"
                  aria-label={running ? 'Pause' : 'Start'}
                >
                  {running ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </button>
                <button
                  onClick={skip}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-muted transition-all hover:border-accent/25 hover:text-text"
                  aria-label="Skip phase"
                >
                  <Coffee size={19} />
                </button>
              </div>

              <p className="relative mt-6 max-w-xs text-center text-sm leading-6 text-muted">
                {phase === 'work'
                  ? 'Focus deeply. One task at a time.'
                  : 'Step away from the screen. Let your attention rest.'}
              </p>
            </div>

            <div className="border-t border-line/70 bg-surface/50 p-6 lg:border-l lg:border-t-0">
              <SectionHeading
                title="The ritual"
                description="A simple loop that protects your attention."
              />
              <ol className="mt-5 space-y-4">
                {[
                  { title: 'Choose one thing', body: 'Close the extra tabs. Name the task.' },
                  { title: 'Focus for 25 minutes', body: 'No switching. Let the timer hold the boundary.' },
                  { title: 'Take a real break', body: 'Stand up, breathe, look away from the screen.' },
                  { title: 'Repeat four times', body: 'Then take a longer break to reset.' },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-soft text-[11px] font-bold text-accent">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center justify-between rounded-xl border border-line/60 bg-card/60 px-3 py-2.5 text-xs">
                <span className="text-muted">Sessions this cycle</span>
                <span className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((slot) => (
                    <span
                      key={slot}
                      className={cn(
                        'h-2 w-2 rounded-full transition-colors',
                        slot < workCount % 4 || (workCount > 0 && workCount % 4 === 0)
                          ? 'bg-accent'
                          : 'bg-line'
                      )}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={120}>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Timer size={16} />}
            title="Focus rhythm"
            description="Completed minutes over the last 14 days."
          />
          <div className="mt-5">
            {totalMinutes === 0 ? (
              <EmptyState
                icon={<Timer size={24} />}
                title="Your first session starts the chart"
                body="Press play above. A single focused block is enough to begin."
              />
            ) : (
              <BarChart data={focusSeries} height={160} />
            )}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
