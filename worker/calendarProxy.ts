import { parseAirbnbCalendarUrl } from "../src/lib/calendarUrl";

/**
 * POST /api/calendar  { "url": "https://www.airbnb.com/calendar/ical/….ics?s=…" }
 *
 * Airbnb's calendar feed sends no CORS headers, so a browser page can't read
 * it directly. This fetches it and hands the text straight back.
 *
 * Privacy rules this file keeps:
 * - The link carries a secret (`s=`), so it travels in the POST body, never
 *   the query string, where request logs would capture it.
 * - Nothing is stored, cached, or logged. No console.* calls in here.
 * - Only Airbnb calendar links are fetched, redirects included, so this can't
 *   be used as an open proxy.
 */

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...BASE_HEADERS, "Content-Type": "application/json" },
  });
}

/** Follow redirects by hand so every hop has to pass the Airbnb check too. */
async function fetchCalendar(url: URL, fetchImpl: typeof fetch): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetchImpl(current.toString(), {
      redirect: "manual",
      headers: { Accept: "text/calendar, text/plain;q=0.9" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status < 300 || res.status >= 400) return res;
    const next = parseAirbnbCalendarUrl(
      new URL(res.headers.get("Location") ?? "", current).toString()
    );
    if (!next) throw new Error("redirected away from Airbnb");
    current = next;
  }
  throw new Error("too many redirects");
}

async function readCapped(res: Response): Promise<string | null> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function handleCalendarRequest(
  request: Request,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...BASE_HEADERS, Allow: "POST" } });
  }

  // Same-origin only. Browsers always send Origin on a cross-site POST.
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail(403, "Cross-origin requests are not allowed.");
  }

  let raw: unknown;
  try {
    raw = ((await request.json()) as { url?: unknown })?.url;
  } catch {
    return fail(400, 'Send JSON like {"url": "…"}.');
  }
  const url = typeof raw === "string" ? parseAirbnbCalendarUrl(raw) : null;
  if (!url) return fail(400, "That isn't an Airbnb calendar link.");

  let upstream: Response;
  try {
    upstream = await fetchCalendar(url, fetchImpl);
  } catch {
    return fail(502, "Couldn't reach Airbnb. Try again in a minute.");
  }
  if (upstream.status === 404 || upstream.status === 403 || upstream.status === 401) {
    return fail(404, "Airbnb didn't recognise that link. It may have been reset — copy it again.");
  }
  if (!upstream.ok) return fail(502, `Airbnb answered with an error (${upstream.status}).`);

  const text = await readCapped(upstream);
  if (text === null) return fail(502, "That calendar is too large.");
  if (!text.includes("BEGIN:VCALENDAR")) {
    return fail(502, "Airbnb didn't send back a calendar.");
  }

  return new Response(text, {
    status: 200,
    headers: { ...BASE_HEADERS, "Content-Type": "text/calendar; charset=utf-8" },
  });
}
