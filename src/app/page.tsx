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
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeSwitcher';

const FEATURES = [
  { icon: CheckSquare, title: 'Tasks', body: 'Add, prioritize and schedule tasks with due dates, deadlines and reminders.' },
  { icon: Flame, title: 'Habits', body: 'Build streaks and track daily consistency with an interactive heatmap.' },
  { icon: Target, title: 'Goals', body: 'Set measurable goals and watch progress move toward completion.' },
  { icon: Timer, title: 'Focus', body: 'Pomodoro focus sessions with breaks, built for deep work.' },
  { icon: CalendarDays, title: 'Calendar', body: 'See tasks by day, week or month at a glance.' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Private by design', body: 'Your data is scoped to your account only.' },
  {
    icon: Cloud,
    title: 'Cloud sync',
    body: 'Your workspace syncs securely to the cloud, so everything stays available across devices.',
  },
  { icon: Smartphone, title: 'Installable PWA', body: 'Use Veyro on desktop and mobile like a native app.' },
];

const PREVIEW_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: CheckSquare, label: 'Tasks' },
  { icon: Flame, label: 'Habits' },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: Timer, label: 'Focus' },
  { icon: Target, label: 'Goals' },
  { icon: Settings, label: 'Settings' },
];

const PREVIEW_TASKS = [
  { title: 'Plan the week', meta: 'Today · High', tone: 'bg-accent/15 text-accent' },
  { title: 'Deep work block', meta: '9:00 – 10:30', tone: 'bg-success/15 text-success' },
  { title: 'Evening walk', meta: 'Habit · Daily', tone: 'bg-warning/15 text-warning' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Veyro home" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast"
          >
            V
          </span>
          <span className="text-xl font-bold tracking-tight">Veyro</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/auth/login" className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-text sm:px-4">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong sm:px-4"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="relative isolate mx-auto flex max-w-6xl flex-col items-center overflow-hidden px-6 pb-24 pt-20 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[760px] max-w-full -translate-x-1/2 rounded-full bg-accent/[0.08] blur-[120px]"
        />
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-accent" />
          Productivity, reimagined
        </p>
        <h1 className="max-w-3xl text-balance bg-gradient-to-b from-text via-text to-text/55 bg-clip-text text-5xl font-semibold tracking-[-0.05em] text-transparent sm:text-6xl lg:text-7xl">
          Focus, simplified.
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg leading-8 text-muted">
          Veyro is a calm productivity workspace for tasks, habits, goals and deep work — installable as an app.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="rounded-2xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-contrast transition-transform hover:scale-[1.02] hover:bg-accent-strong"
          >
            Start free
          </Link>
          <Link
            href="/auth/login"
            className="rounded-2xl border border-line px-6 py-3.5 text-base font-semibold transition-colors hover:bg-raised"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">Free to get started. No credit card required.</p>

        <section aria-labelledby="preview-heading" className="relative mt-16 w-full max-w-5xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-8 bottom-6 rounded-[36px] bg-accent/[0.07] blur-3xl"
          />
          <h2 id="preview-heading" className="sr-only">
            Veyro dashboard preview
          </h2>
          <p className="sr-only">
            Preview of the Veyro dashboard showing tasks, habit streak and focus time.
          </p>
          <div aria-hidden="true" className="surface-card relative overflow-hidden p-2 sm:p-3">
            <div className="rounded-[18px] border border-line bg-ink/80">
              <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                  <span className="ml-2 text-xs font-medium text-muted">veyro / dashboard</span>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Preview
                </span>
              </div>
              <div className="grid gap-4 p-4 text-left sm:p-6 lg:grid-cols-[220px_1fr]">
                <aside className="hidden flex-col gap-1 rounded-xl border border-line bg-surface/60 p-3 lg:flex">
                  {PREVIEW_NAV.map((item) => (
                    <div
                      key={item.label}
                      className={[
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                        item.active ? 'bg-accent-soft text-accent' : 'text-muted',
                      ].join(' ')}
                    >
                      <item.icon size={15} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </aside>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Good morning</p>
                      <p className="mt-1 text-lg font-semibold">Your day at a glance</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast">
                      + New task
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: 'Tasks today', value: '6' },
                      { label: 'Habit streak', value: '12 days' },
                      { label: 'Focus time', value: '2h 15m' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-line bg-card p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{stat.label}</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-line bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold">Today&apos;s focus</p>
                      <span className="text-[10px] text-muted">3 of 8 done</span>
                    </div>
                    <div className="space-y-1.5">
                      {PREVIEW_TASKS.map((task) => (
                        <div key={task.title} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-raised">
                          <span className="h-4 w-4 shrink-0 rounded-full border border-line" />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{task.title}</span>
                          <span className={['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', task.tone].join(' ')}>
                            {task.meta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="mt-20 w-full max-w-5xl">
          <h2 id="features-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to stay focused
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            One calm place for the work that matters — no clutter, no noise.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} variant="interactive" className="p-6 text-left">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="trust-heading" className="mt-16 w-full max-w-4xl">
          <h2 id="trust-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
            Private by design. Yours everywhere.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRUST.map((f) => (
              <Card key={f.title} variant="interactive" className="p-6 text-center">
                <f.icon size={22} className="mx-auto mb-3 text-accent" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <p>Veyro — a calm place to get things done.</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-text">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text">
              Terms
            </Link>
            <a
              href="https://github.com/spoongyx/veyro/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-text"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
