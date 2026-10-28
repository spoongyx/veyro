'use client';

import { useEffect, useMemo, useState } from 'react';
import { Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useFocusSessions } from '@/lib/hooks/use-entities';
import { showAppNotification } from '@/lib/notifications';
import { focusMinutesSeries, totalFocusMinutes } from '@/lib/utils/analytics';
import { Button, Card, EmptyState, SectionHeading, StatCard } from '@/components/ui';
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
        <StatCard label="Today" value={`${focusMinutesToday}m`} sub={`${sessionsToday} sessions`} icon={<Timer size={16} />} tone="accent" />
        <StatCard label="Sessions" value={completedSessions.length} sub="completed all time" icon={<Timer size={16} />} tone="success" />
        <StatCard label="Deep work" value={`${Math.round(totalMinutes / 60)}h`} sub="total focused time" icon={<Timer size={16} />} tone="accent" />
        <StatCard label="This cycle" value={workCount} sub="pomodoros before a long break" icon={<Coffee size={16} />} tone="warning" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative flex flex-col items-center justify-center px-6 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgb(var(--accent)/0.08),transparent_65%)]" />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{PHASE_LABEL[phase]}</p>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-bold tabular-nums tracking-[-0.04em] text-text">{formatClock(secondsLeft)}</p>
                <p className="mt-1.5 text-xs font-medium text-muted">
                  {Math.round(phaseSeconds / 60)} minute {phase === 'work' ? 'session' : 'break'}
                </p>
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
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-card transition-all duration-200 hover:scale-105 hover:bg-accent-strong active:scale-95"
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

          <div className="border-t border-line bg-surface/60 p-6 lg:border-l lg:border-t-0">
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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => switchPhase('work')} disabled={phase === 'work'}>
                Focus
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => switchPhase('short_break')}
                disabled={phase === 'short_break'}
              >
                Short break
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => switchPhase('long_break')}
                disabled={phase === 'long_break'}
              >
                Long break
              </Button>
            </div>
          </div>
        </div>
      </Card>

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
    </div>
  );
}
