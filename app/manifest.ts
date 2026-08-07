import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PlantVerse AI",
    short_name: "PlantVerse",
    description:
      "AI-assisted plant health, soil guidance, growing-space planning, plant records and gardening tools.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f8f3",
    theme_color: "#16794a",
    orientation: "portrait-primary",
    categories: ["lifestyle", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Smart Scan",
        short_name: "Scan",
        description: "Open PlantVerse Smart Scan",
        url: "/scan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Grow Planner",
        short_name: "Planner",
        description: "Open the PlantVerse growing-space planner",
        url: "/planner",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
