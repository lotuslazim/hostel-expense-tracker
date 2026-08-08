import type { MetadataRoute } from "next";

// Required because next.config uses output: "export"
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BachelorBite",
    short_name: "BachelorBite",
    description:
      "Simplified meal and expense tracking for shared living.",

    start_url: "/",
    scope: "/",

    display: "standalone",
    orientation: "portrait-primary",

    background_color: "#ffffff",
    theme_color: "#f4b43c",

    lang: "en",
    dir: "ltr",

    categories: ["food", "finance", "lifestyle"],

    icons: [
      {
        src: "/logo1.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo1.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
