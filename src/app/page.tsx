import Link from 'next/link';
import {
  CheckSquare,
  Flame,
  Target,
  Timer,
  CalendarDays,
  Cloud,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeSwitcher';

const FEATURES = [
  { icon: CheckSquare, title: 'Tasks', body: 'Add, prioritize and schedule tasks with due dates, deadlines and reminders.' },
  { icon: Flame, title: 'Habits', body: 'Build streaks and track daily consistency with an interactive heatmap.' },
  { icon: Target, title: 'Goals', body: 'Set measurable goals and watch progress move toward completion.' },
  { icon: Timer, title: 'Focus', body: 'Pomodoro focus sessions with breaks, built for deep work.' },
  { icon: CalendarDays, title: 'Calendar', body: 'See tasks by day, week or month at a glance.' },
  { icon: Cloud, title: 'Cloud sync', body: 'Your workspace syncs to the cloud so it follows you everywhere.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">V</span>
          <span className="text-xl font-bold tracking-tight">Veyro</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/auth/login" className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-text sm:px-4">Sign in</Link>
          <Link href="/auth/signup" className="rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong sm:px-4">Get started</Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center">
        <p className="mb-6 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted">
          Productivity, reimagined
        </p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Focus, simplified.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Veyro is a calm productivity workspace for tasks, habits, goals and deep work, synced to the cloud and installable as an app.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/signup" className="rounded-2xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-contrast transition-transform hover:scale-[1.02] hover:bg-accent-strong">Start free</Link>
          <Link href="/auth/login" className="rounded-2xl border border-line px-6 py-3.5 text-base font-semibold transition-colors hover:bg-raised">Sign in</Link>
        </div>

        <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6 text-left">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Private by design', body: 'Your data is scoped to your account only.' },
            { icon: Cloud, title: 'Cloud sync', body: 'Everything stays available across devices.' },
            { icon: Smartphone, title: 'Installable PWA', body: 'Use Veyro on desktop and mobile like a native app.' },
          ].map((f) => (
            <Card key={f.title} className="p-6 text-center">
              <f.icon size={22} className="mx-auto mb-3 text-accent" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        <p>Veyro - a calm place to get things done.</p>
      </footer>
    </div>
  );
}