import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PlantVerse AI",
    short_name: "PlantVerse",
    description:
      "AI-assisted plant, soil, land, marketplace and garden workspace.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f8f3",
    theme_color: "#16794a",
    orientation: "portrait-primary",
    categories: ["lifestyle", "productivity", "shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}