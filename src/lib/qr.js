export const QR_IMAGE_OPTIONS = {
  margin: 1,
  width: 320,
  color: {
    dark: "#071716",
    light: "#ffffff",
  },
};

export function scanUrlFor(baseUrl, id) {
  return `${baseUrl}/r/${id}`;
}
