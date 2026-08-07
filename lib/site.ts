const DEFAULT_SITE_URL = "https://plantverse-ai.vercel.app";

function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const SITE_NAME = "PlantVerse AI";
export const SITE_DESCRIPTION =
  "AI-assisted plant health, soil guidance, growing-space planning, plant records and gardening tools.";

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    DEFAULT_SITE_URL,
);

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

export function allowSearchIndexing(): boolean {
  const explicit = process.env.ALLOW_INDEXING?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  // Vercel preview deployments should never compete with the production URL.
  if (process.env.VERCEL === "1") {
    return process.env.VERCEL_ENV === "production";
  }

  // Keep local/dev builds out of search engines unless explicitly enabled.
  return false;
}
