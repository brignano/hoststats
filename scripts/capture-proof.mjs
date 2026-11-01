/**
 * Capture the product page's proof slot: the real dashboard on the bundled
 * example data, once per theme.
 *
 * DESIGN.md §13 requires the proof to be the product itself — a live demo, a
 * real screenshot or a real screen recording, never stock imagery. The app
 * cannot be embedded in the hero (the site sends X-Frame-Options: DENY), so
 * these are screenshots of the built site, and this script is committed so they
 * can be regenerated instead of being binaries nobody can reproduce.
 *
 *   npm run build && npm run proof
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const WIDTH = 900;
const HEIGHT = 580;
const ORIGIN = "http://localhost:4174";

const server = spawn(process.execPath, ["e2e/serve.mjs"], {
  env: { ...process.env, PORT: "4174" },
  stdio: ["ignore", "inherit", "inherit"],
});
const stop = () => server.kill();
process.on("exit", stop);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${ORIGIN}/app/`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`${ORIGIN} never came up — did you run npm run build first?`);
}

await waitForServer();

const browser = await chromium.launch();
try {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({
      colorScheme,
      viewport: { width: WIDTH, height: HEIGHT },
      // Retina, so the shot stays crisp in the hero's frame.
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/app/?demo=1`);
    // The deep link loads the example export itself; wait for the dashboard.
    await page.getByRole("heading", { name: "What to do now" }).waitFor();
    // Recharts animates its bars in on mount even under reducedMotion.
    await page.waitForTimeout(1200);
    const out = `public/dashboard-${colorScheme}.png`;
    await page.screenshot({ path: out });
    console.log(`wrote ${out} (${WIDTH}x${HEIGHT} @2x, ${colorScheme})`);
    await context.close();
  }
} finally {
  await browser.close();
  stop();
}
