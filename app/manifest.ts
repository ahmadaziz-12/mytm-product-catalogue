import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MYTM Product Catalogue",
    short_name: "MYTM Catalogue",
    description: "MYTM products and services catalogue",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#c7192e",
    icons: [{ src: "/mytm-logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
