/** @type {import('next').NextConfig} */
const nextConfig = {
  // HostStats does all its work in the browser, so there is nothing to render
  // on a server. A static export drops straight onto Cloudflare Workers assets.
  output: "export",
  images: { unoptimized: true },
  // Emit `out/foo/index.html` so paths resolve the same on Workers as locally.
  trailingSlash: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
