/* eslint-disable @next/next/no-img-element */
import QRCode from "qrcode";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSiteUrl } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

async function getPrintableCodes() {
  const { data, error } = await getSupabase()
    .from("qr_codes")
    .select("id")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const baseUrl = getSiteUrl();
  return Promise.all(
    (data || []).map(async (code) => ({
      id: code.id,
      image: await QRCode.toDataURL(`${baseUrl}/r/${code.id}`, {
        margin: 1,
        width: 320,
        color: {
          dark: "#071716",
          light: "#ffffff",
        },
      }),
    }))
  );
}

export default async function PrintPage() {
  await requireAdmin();
  const codes = await getPrintableCodes();

  return (
    <main className="shell print-shell">
      <header className="topbar print-chrome">
        <div>
          <p className="eyebrow">Print station</p>
          <h1>Blank Beacon code sheet</h1>
        </div>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <PrintButton />
        </nav>
      </header>

      <section className="print-grid">
        {codes.map((code) => (
          <article className="qr-card" key={code.id}>
            <img src={code.image} alt={`QR code ${code.id}`} />
            <p>{code.id}</p>
            {/* High-res PNG is generated on demand by /api/qr/[id] — baking
                20 × 1024px data URLs into this page blew the Worker's
                per-request CPU limit (Cloudflare error 1102). */}
            <a className="qr-download" href={`/api/qr/${code.id}`}>
              Download PNG
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
