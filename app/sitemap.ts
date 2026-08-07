import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/safety", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/cookies", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/shipping", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/refunds", changeFrequency: "yearly" as const, priority: 0.4 },
  ].map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
