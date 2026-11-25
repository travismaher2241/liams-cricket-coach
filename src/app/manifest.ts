import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liam's Cricket",
    short_name: "Cricket",
    description: "Personal cricket development companion",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1726",
    theme_color: "#0b1726",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
