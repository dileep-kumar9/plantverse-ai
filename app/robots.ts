import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const allow = process.env.ALLOW_INDEXING === "true";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: allow
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/profile", "/settings", "/memory", "/orders"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: allow ? `${base}/sitemap.xml` : undefined,
  };
}
