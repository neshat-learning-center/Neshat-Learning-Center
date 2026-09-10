export function NotConnected({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-line bg-sand p-5 text-sm text-ink-soft">{message}</div>
  );
}
