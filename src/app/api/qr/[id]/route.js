import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin";
import { filenameFor, getSiteUrl } from "@/lib/beacon";
import { QR_EXPORT_OPTIONS, scanUrlFor } from "@/lib/qr";
import { getSupabase } from "@/lib/supabase";

// One QR PNG per request, generated on demand — the dashboard modal and every
// download link point here. Per-request rendering is deliberate: baking
// dozens of high-res data URLs into a single page blew the Worker's
// per-request CPU limit (Cloudflare error 1102).
//
// Not in the middleware's PUBLIC_PREFIXES, so this needs the admin cookie.
export async function GET(request, { params }) {
  await requireAdmin();
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("qr_codes")
    .select("id, label")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response("Lookup failed.", { status: 500 });
  }

  if (!data) {
    return new Response("Unknown code.", { status: 404 });
  }

  const png = await QRCode.toBuffer(
    scanUrlFor(getSiteUrl(), id),
    QR_EXPORT_OPTIONS
  );

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      // Names browser downloads; <img> rendering ignores the disposition.
      "Content-Disposition": `attachment; filename="${filenameFor(data)}"`,
      // A code's URL never changes, so the rendered PNG never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
