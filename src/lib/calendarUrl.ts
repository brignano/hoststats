/**
 * Which calendar links HostStats will fetch.
 *
 * The proxy fetches a URL on a visitor's behalf, so it must never become a
 * general-purpose one: only Airbnb's own iCal export path, over HTTPS, on
 * Airbnb's own domains. The browser runs the same check first so a bad paste
 * fails instantly with a helpful message instead of a round trip.
 */

// Airbnb serves the export link on the host's local domain.
const AIRBNB_TLDS = [
  "com",
  "ca",
  "co.uk",
  "ie",
  "com.au",
  "co.nz",
  "de",
  "at",
  "ch",
  "fr",
  "be",
  "nl",
  "es",
  "pt",
  "it",
  "se",
  "dk",
  "no",
  "fi",
  "pl",
  "gr",
  "mx",
  "com.br",
  "co.in",
  "jp",
  "co.kr",
];

const HOSTS = new Set(AIRBNB_TLDS.flatMap((tld) => [`airbnb.${tld}`, `www.airbnb.${tld}`]));

const PATH = /^\/calendar\/ical\/\d+\.ics$/;

/** The parsed URL if it is an Airbnb calendar export link, otherwise null. */
export function parseAirbnbCalendarUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.port) return null;
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;
  if (!PATH.test(url.pathname)) return null;
  url.hash = "";
  return url;
}
