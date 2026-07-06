import Link from "next/link";
import { deleteCode, deleteCodes, generateCodes, getCodeAnalytics, programCode } from "@/lib/actions";
import { logoutAdmin } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import CodesTable from "./CodesTable";
import GenerateButton from "./GenerateButton";

export const dynamic = "force-dynamic";

async function getCodes() {
  const { data, error } = await getSupabase()
    .from("qr_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export default async function Dashboard() {
  await requireAdmin();
  const codes = await getCodes();
  const totalScans = codes.reduce((sum, code) => sum + Number(code.scan_count || 0), 0);
  const liveCount = codes.filter((code) => code.destination).length;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Beacon command</p>
          <h1>Dynamic QR codes</h1>
        </div>
        <nav className="nav">
          <Link href="/export" className="btn btn-secondary">
            Export CSV
          </Link>
          <Link href="/print" className="btn btn-secondary">
            Print sheet
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="btn-outline">
              Sign out
            </button>
          </form>
        </nav>
      </header>

      <section className="control-band">
        <form action={generateCodes} className="generator">
          <label htmlFor="count">New blank codes</label>
          <div>
            <input id="count" name="count" type="number" min="1" max="300" defaultValue="1" />
            <GenerateButton />
          </div>
        </form>
        <div className="metric">
          <span>{codes.length}</span>
          <p>Total codes</p>
        </div>
        <div className="metric">
          <span>{liveCount}</span>
          <p>Live codes</p>
        </div>
        <div className="metric">
          <span>{totalScans}</span>
          <p>Total scans</p>
        </div>
      </section>

      <CodesTable
        codes={codes}
        deleteCode={deleteCode}
        deleteCodes={deleteCodes}
        programCode={programCode}
        getCodeAnalytics={getCodeAnalytics}
      />
    </main>
  );
}
