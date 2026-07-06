import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { buildDaily, buildLocations, formatDate } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getAnalytics(id) {
  const supabase = getSupabase();
  const [{ data: code, error: codeError }, { data: scans, error: scanError }] =
    await Promise.all([
      supabase.from("qr_stats").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("scans")
        .select("scanned_at,country")
        .eq("qr_id", id)
        .order("scanned_at", { ascending: true }),
    ]);

  if (codeError) {
    throw new Error(codeError.message);
  }
  if (scanError) {
    throw new Error(scanError.message);
  }

  return { code, scans: scans || [] };
}

export default async function AnalyticsPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const { code, scans } = await getAnalytics(id);

  if (!code) {
    return (
      <main className="shell">
        <Link href="/" className="back-link">
          Back to dashboard
        </Link>
        <h1>Code not found</h1>
      </main>
    );
  }

  const daily = buildDaily(scans);
  const locations = buildLocations(scans);
  const firstScan = scans[0]?.scanned_at;
  const lastScan = scans[scans.length - 1]?.scanned_at;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Analytics / {id}</p>
          <h1>{code.label || code.id}</h1>
        </div>
        <nav className="nav">
          <Link href="/" className="btn btn-outline">
            Dashboard
          </Link>
          <Link href={`/r/${id}?edit=1`} target="_blank" className="btn btn-secondary">
            Reprogram
          </Link>
        </nav>
      </header>

      <section className="control-band">
        <div className="metric">
          <span>{code.scan_count}</span>
          <p>Total scans</p>
        </div>
        <div className="metric">
          <span>{formatDate(firstScan)}</span>
          <p>First scan</p>
        </div>
        <div className="metric">
          <span>{formatDate(lastScan)}</span>
          <p>Last scan</p>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="chart-panel">
          <h2>Last 14 days</h2>
          <div className="bar-chart">
            {daily.map((day) => (
              <div className="bar-slot" key={day.key}>
                <span style={{ height: day.height }} title={`${day.count} scans`} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-panel">
          <h2>Top locations</h2>
          {locations.length ? (
            <ul className="location-list">
              {locations.map((location) => (
                <li key={location.country}>
                  <span>{location.country}</span>
                  <strong>{location.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No country data has been reported yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
