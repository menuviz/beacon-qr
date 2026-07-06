export const QR_IMAGE_OPTIONS = {
  margin: 1,
  width: 320,
  color: {
    dark: "#071716",
    light: "#ffffff",
  },
};

// High-res render served by /api/qr/[id] (modal display + downloads), so a
// single code printed on a business card stays crisp.
export const QR_EXPORT_OPTIONS = {
  type: "png",
  margin: 2,
  width: 1024,
  color: QR_IMAGE_OPTIONS.color,
};

export function scanUrlFor(baseUrl, id) {
  return `${baseUrl}/r/${id}`;
}
