export default function AdminLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-sand-deep" />
        <div className="h-9 w-24 rounded-full bg-sand-deep" />
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="h-10 bg-sand" />
        <div className="h-14 border-t border-line bg-canvas" />
        <div className="h-14 border-t border-line bg-canvas" />
        <div className="h-14 border-t border-line bg-canvas" />
      </div>
    </div>
  );
}
