import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required for `output: "export"`: emit robots.txt at build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/calendar only proxies Airbnb calendar feeds; nothing there to index.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
