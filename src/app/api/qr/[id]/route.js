import { PNG } from "pngjs";
import { create as createQrMatrix } from "qrcode/lib/core/qrcode.js";
import { requireAdmin } from "@/lib/admin";
import { filenameFor, getSiteUrl } from "@/lib/beacon";
import { QR_EXPORT_OPTIONS, scanUrlFor } from "@/lib/qr";
import { QR_LOGO_BADGE_RGBA_BASE64, QR_LOGO_BADGE_SIZE } from "@/lib/qrLogoBadge";
import { getSupabase } from "@/lib/supabase";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Rasterizes a QR matrix straight to RGBA pixels, mirroring qrcode's own
// renderer/utils.js#qrToImageData. We can't use QRCode.toBuffer() + pngjs's
// PNG.sync.read() here: pngjs's decode path calls Node's zlib.Inflate the
// old "callable without new" way, which throws under the Workers
// nodejs_compat polyfill's real ES6 Inflate class ("Class constructor
// Inflate cannot be invoked without 'new'"). Encoding (zlib.deflateSync,
// used by PNG.sync.write below) is a plain function call and has no such
// issue — so this path only ever encodes a PNG, never decodes one.
function rasterizeQr(qrMatrix, { width, margin, dark, light }) {
  const size = qrMatrix.size;
  const modules = qrMatrix.data;
  const scale = width / (size + margin * 2);
  const scaledMargin = margin * scale;
  const imgSize = Math.floor((size + margin * 2) * scale);
  const pixels = Buffer.alloc(imgSize * imgSize * 4);

  for (let i = 0; i < imgSize; i++) {
    for (let j = 0; j < imgSize; j++) {
      const pos = (i * imgSize + j) * 4;
      let color = light;

      if (
        i >= scaledMargin &&
        j >= scaledMargin &&
        i < imgSize - scaledMargin &&
        j < imgSize - scaledMargin
      ) {
        const iSrc = Math.floor((i - scaledMargin) / scale);
        const jSrc = Math.floor((j - scaledMargin) / scale);
        color = modules[iSrc * size + jSrc] ? dark : light;
      }

      pixels[pos] = color[0];
      pixels[pos + 1] = color[1];
      pixels[pos + 2] = color[2];
      pixels[pos + 3] = 255;
    }
  }

  return { width: imgSize, height: imgSize, data: pixels };
}

// Alpha-blits the pre-composited (white plate + brand logo) badge, stored as
// raw RGBA (see qrLogoBadge.js for why not a PNG), onto the center of the
// rasterized QR, then encodes the result — the only pngjs call in this path.
function withLogoBadge(qrImage) {
  const badge = Buffer.from(QR_LOGO_BADGE_RGBA_BASE64, "base64");
  const badgeSize = QR_LOGO_BADGE_SIZE;
  const x0 = Math.floor((qrImage.width - badgeSize) / 2);
  const y0 = Math.floor((qrImage.height - badgeSize) / 2);

  for (let y = 0; y < badgeSize; y++) {
    for (let x = 0; x < badgeSize; x++) {
      const si = (badgeSize * y + x) << 2;
      const di = (qrImage.width * (y + y0) + (x + x0)) << 2;
      qrImage.data[di] = badge[si];
      qrImage.data[di + 1] = badge[si + 1];
      qrImage.data[di + 2] = badge[si + 2];
      qrImage.data[di + 3] = 255;
    }
  }

  return PNG.sync.write(qrImage);
}

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

  const { modules: qrMatrix } = createQrMatrix(scanUrlFor(getSiteUrl(), id), {
    errorCorrectionLevel: QR_EXPORT_OPTIONS.errorCorrectionLevel,
  });

  const qrImage = rasterizeQr(qrMatrix, {
    width: QR_EXPORT_OPTIONS.width,
    margin: QR_EXPORT_OPTIONS.margin,
    dark: hexToRgb(QR_EXPORT_OPTIONS.color.dark),
    light: hexToRgb(QR_EXPORT_OPTIONS.color.light),
  });

  return new Response(withLogoBadge(qrImage), {
    headers: {
      "Content-Type": "image/png",
      // Names browser downloads; <img> rendering ignores the disposition.
      "Content-Disposition": `attachment; filename="${filenameFor(data)}"`,
      // A code's URL never changes, so the rendered PNG never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
