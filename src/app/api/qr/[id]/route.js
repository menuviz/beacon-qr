import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

// High-res QR PNG for one code, generated on demand. The print sheet links
// here instead of baking 1024px data URLs into the page — one encode per
// request stays well inside the Worker CPU limit, twenty did not (error 1102).
//
// Not in the middleware's PUBLIC_PREFIXES, so this needs the admin cookie.
export async function GET(request, { params }) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("qr_codes")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response("Lookup failed.", { status: 500 });
  }

  if (!data) {
    return new Response("Unknown code.", { status: 404 });
  }

  const png = await QRCode.toBuffer(`${getSiteUrl()}/r/${id}`, {
    type: "png",
    margin: 2,
    width: 1024,
    color: {
      dark: "#071716",
      light: "#ffffff",
    },
  });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="beacon-${id}.png"`,
      // A code's URL never changes, so the rendered PNG never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
