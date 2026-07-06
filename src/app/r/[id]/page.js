import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

// Geo comes from Cloudflare's request.cf object (exposed by the OpenNext
// adapter); the cf-ipcountry header is the fallback. Outside Workers (plain
// `next dev`) getCloudflareContext throws — treat that as "no geo".
function getRequestGeo() {
  try {
    const { cf } = getCloudflareContext();
    return { country: cf?.country ?? null, city: cf?.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

// The scan path is the product's hot path: a diner is standing there waiting
// for the redirect. Request-scoped data (headers, geo) is read up front, then
// the insert runs via waitUntil so the redirect never waits on it — and a
// logging failure can never break a scan. Outside Workers (next dev) there is
// no waitUntil, so it degrades to awaiting the insert.
async function logScan(id) {
  const headerList = await headers();
  const geo = getRequestGeo();

  const insert = getSupabase()
    .from("scans")
    .insert({
      qr_id: id,
      country: geo.country ?? headerList.get("cf-ipcountry"),
      city: geo.city,
      referrer: headerList.get("referer"),
      user_agent: headerList.get("user-agent"),
    })
    .then(({ error }) => {
      if (error) {
        console.error("Scan log failed", error.message);
      }
    });

  try {
    getCloudflareContext().ctx.waitUntil(insert);
  } catch {
    await insert;
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

  await logScan(id);
  redirect(code.destination);
}
