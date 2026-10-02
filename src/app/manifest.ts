import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BaseHarbor Console",
    short_name: "BaseHarbor",
    description: "Visual operations surface for BaseHarbor applications, targets, providers and runtime resources.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B152A",
    theme_color: "#0B152A",
    icons: [
      {
        src: "/baseharbor-icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
    ],
  };
}
