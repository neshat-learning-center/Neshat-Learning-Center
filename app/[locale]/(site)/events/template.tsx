/** Re-mounts on every navigation inside /events, giving a soft fade between pages. */
export default function EventsTemplate({ children }: { children: React.ReactNode }) {
  return <div className="ev-fade">{children}</div>;
}
