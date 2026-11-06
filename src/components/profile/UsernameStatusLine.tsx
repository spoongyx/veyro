'use client';

import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { USERNAME_HINT } from '@/lib/profile';
import type { UsernameStatus } from '@/lib/hooks/use-username-availability';
import { cn } from '@/lib/utils/cn';

const statusCopy: Record<UsernameStatus, string> = {
  idle: USERNAME_HINT,
  checking: 'Checking availability...',
  available: 'That username is available.',
  taken: 'That username is already taken.',
  invalid: USERNAME_HINT,
  error: 'We could not check that username. You can still continue.',
};

export function UsernameStatusLine({ status }: { status: UsernameStatus }) {
  const tone =
    status === 'available'
      ? 'text-success'
      : status === 'taken' || status === 'invalid'
        ? 'text-danger'
        : status === 'error'
          ? 'text-warning'
          : 'text-muted';

  return (
    <p className={cn('mt-1.5 flex items-center gap-1.5 text-xs', tone)}>
      {status === 'checking' ? <Loader2 size={12} className="animate-spin" /> : null}
      {status === 'available' ? <Check size={12} /> : null}
      {status === 'taken' || status === 'invalid' ? <X size={12} /> : null}
      {status === 'error' ? <AlertCircle size={12} /> : null}
      {statusCopy[status]}
    </p>
  );
}
