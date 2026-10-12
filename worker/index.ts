import { handleCalendarRequest } from "./calendarProxy";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/**
 * Everything is static files except /api/*, which `run_worker_first` routes
 * here. Anything else that reaches this script goes straight to the assets.
 */
const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/calendar") return handleCalendarRequest(request);
    if (pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  },
};

export default worker;
