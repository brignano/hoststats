// Serves the static export in ./out for the browser tests, the way
// Cloudflare's static assets do: "/x/" -> out/x/index.html, unknown -> 404.html.
// Dependency-free on purpose: the obvious npm package for this carries an
// open advisory, and this needs thirty lines.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "out");
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, clean);
  if (!file.startsWith(ROOT)) return null;
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolve(req.url ?? "/");
  const status = file ? 200 : 404;
  const path = file ?? join(ROOT, "404.html");
  res.writeHead(status, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
  res.end(await readFile(path));
}).listen(PORT, () => console.log(`Serving ./out on http://localhost:${PORT}`));
