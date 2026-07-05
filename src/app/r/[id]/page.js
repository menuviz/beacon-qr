import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { programCode } from "@/lib/actions";
import { getSupabase } from "@/lib/supabase";
import ProgramForm from "./ProgramForm";

export const dynamic = "force-dynamic";

async function getCode(id) {
  const { data, error } = await getSupabase()
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function logScan(id) {
  const headerList = await headers();
  const { error } = await getSupabase().from("scans").insert({
    qr_id: id,
    country: headerList.get("x-vercel-ip-country"),
    city: headerList.get("x-vercel-ip-city"),
    referrer: headerList.get("referer"),
    user_agent: headerList.get("user-agent"),
  });

  if (error) {
    console.error("Scan log failed", error.message);
  }
}

export default async function ScanRoute({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const code = await getCode(id);

  if (!code) {
    return (
      <main className="scan-shell">
        <section className="program-panel">
          <div className="ping" aria-hidden="true" />
          <p className="eyebrow">Beacon lookup</p>
          <h1>Code not found</h1>
          <p className="muted">This QR code is not registered in this Beacon dashboard.</p>
        </section>
      </main>
    );
  }

  if (!code.destination || query.edit === "1") {
    return (
      <main className="scan-shell">
        <ProgramForm code={code} action={programCode.bind(null, id)} />
      </main>
    );
  }

  after(() => logScan(id));
  redirect(code.destination);
}
