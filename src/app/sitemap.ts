import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required for `output: "export"`: emit sitemap.xml at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // trailingSlash is on, so the canonical paths end in "/".
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/app/`, priority: 0.8 },
    { url: `${SITE_URL}/privacy/`, priority: 0.3 },
    { url: `${SITE_URL}/terms/`, priority: 0.3 },
  ];
}
