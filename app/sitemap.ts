import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return ["/login", "/signup", "/privacy", "/terms", "/cookies", "/shipping", "/refunds", "/safety"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/login" || path === "/signup" ? 0.8 : 0.5,
  }));
}
