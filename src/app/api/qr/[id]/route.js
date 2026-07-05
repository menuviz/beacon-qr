import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin";
import { getSiteUrl } from "@/lib/beacon";
import { QR_IMAGE_OPTIONS, scanUrlFor } from "@/lib/qr";

export async function GET(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const baseUrl = getSiteUrl();
  const png = await QRCode.toBuffer(scanUrlFor(baseUrl, id), QR_IMAGE_OPTIONS);

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
