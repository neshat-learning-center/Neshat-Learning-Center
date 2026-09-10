export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-7 w-48 rounded bg-sand-deep" />
      <div className="h-4 w-72 rounded bg-sand" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-lg bg-sand" />
        <div className="h-32 rounded-lg bg-sand" />
      </div>
      <div className="h-40 rounded-lg bg-sand" />
    </div>
  );
}
