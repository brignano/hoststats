import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required for `output: "export"`: emit sitemap.xml at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // trailingSlash is on, so the canonical paths end in "/".
  return [{ url: `${SITE_URL}/` }, { url: `${SITE_URL}/privacy/` }];
}
