/* eslint-disable @next/next/no-img-element */
import QRCode from "qrcode";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSiteUrl } from "@/lib/beacon";
import { filenameFor } from "@/lib/beacon";
import { QR_IMAGE_OPTIONS, scanUrlFor } from "@/lib/qr";
import { getSupabase } from "@/lib/supabase";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

async function getPrintableCodes(ids) {
  let query = getSupabase()
    .from("qr_codes")
    .select("id, label")
    .order("created_at", { ascending: false });

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const baseUrl = getSiteUrl();
  return Promise.all(
    (data || []).map(async (code) => ({
      id: code.id,
      label: code.label,
      image: await QRCode.toDataURL(scanUrlFor(baseUrl, code.id), QR_IMAGE_OPTIONS),
    }))
  );
}

export default async function PrintPage({ searchParams }) {
  await requireAdmin();
  const query = await searchParams;
  const idsParam = Array.isArray(query.ids) ? query.ids[0] : query.ids;
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : null;
  const codes = await getPrintableCodes(ids);

  return (
    <main className="shell print-shell">
      <header className="topbar print-chrome">
        <div>
          <p className="eyebrow">Print station</p>
          <h1>{ids ? `${codes.length} selected code${codes.length === 1 ? "" : "s"}` : "Blank Beacon code sheet"}</h1>
        </div>
        <nav className="nav">
          <Link href="/" className="btn btn-outline">
            Dashboard
          </Link>
          <PrintButton />
        </nav>
      </header>

      <section className="print-grid">
        {codes.map((code) => (
          <article className="qr-card" key={code.id}>
            <img src={code.image} alt={`QR code ${code.id}`} />
            <p>{code.label || code.id}</p>
            {/* High-res PNG comes from /api/qr/[id] on demand — baking
                high-res data URLs into this page blew the Worker's
                per-request CPU limit (Cloudflare error 1102). */}
            <a
              className="qr-download"
              href={`/api/qr/${code.id}`}
              download={filenameFor(code)}
            >
              Download PNG
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
