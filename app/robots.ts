import type { MetadataRoute } from "next";

import { allowSearchIndexing, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!allowSearchIndexing()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/assistant",
        "/cart",
        "/community",
        "/dashboard",
        "/devices",
        "/marketplace",
        "/memory",
        "/notifications",
        "/orders",
        "/planner",
        "/plants",
        "/profile",
        "/reminders",
        "/scan",
        "/settings",
        "/translator",
        "/verify-email",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
