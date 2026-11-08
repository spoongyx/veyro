import Image from 'next/image';
import { APP_VERSION } from '@/lib/version';
import { cn } from '@/lib/utils/cn';

export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black ring-1 ring-line/80',
        className
      )}
    >
      <Image
        src="/logo.png"
        alt=""
        width={512}
        height={512}
        priority={priority}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function BrandVersion({ className }: { className?: string }) {
  return (
    <span
      title={`Version ${APP_VERSION}`}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-line/80 bg-card/60 px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wider text-muted',
        className
      )}
    >
      {APP_VERSION}
    </span>
  );
}
