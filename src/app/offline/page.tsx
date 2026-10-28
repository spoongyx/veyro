export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink p-8 text-center">
      <h1 className="text-2xl font-bold text-text">You&apos;re offline</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Veyro is still loading your last saved workspace. Changes will sync automatically once you reconnect.
      </p>
    </div>
  );
}
