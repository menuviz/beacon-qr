export const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const CODE_LENGTH = 6;
export const QR_PROGRAMMED_CHANNEL = "beacon:qr-programmed";

export function makeCodeId() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function normalizeDestination(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function formatDate(value) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function filenameFor(code) {
  const slug = String(code.label || code.id)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || code.id}.png`;
}

export function truncateUrl(value, max = 44) {
  if (!value) {
    return "Unassigned";
  }

  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

export function lastNDays(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return date;
  });
}

export function buildDaily(scans) {
  const days = lastNDays(14);
  const counts = new Map(days.map((date) => [date.toISOString().slice(0, 10), 0]));

  for (const scan of scans) {
    const key = new Date(scan.scanned_at).toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, counts.get(key) + 1);
    }
  }

  const max = Math.max(1, ...counts.values());
  return days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const count = counts.get(key);
    return {
      key,
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count,
      height: `${Math.max(8, (count / max) * 100)}%`,
    };
  });
}

export function buildLocations(scans) {
  const counts = new Map();

  for (const scan of scans) {
    if (scan.country) {
      counts.set(scan.country, (counts.get(scan.country) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
