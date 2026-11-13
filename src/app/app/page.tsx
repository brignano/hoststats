"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import UploadDropzone from "@/components/UploadDropzone";
import CalendarLinkForm from "@/components/CalendarLinkForm";
import { SAMPLE_AS_OF, SAMPLE_COSTS } from "@/lib/sample";
import { AlertCircleIcon } from "@/components/icons";
import { Costs, ParsedData } from "@/lib/models";
import { parseFile } from "@/lib/importers";
import { mergeParsed } from "@/lib/merge";
import { loadAirbnbCalendar } from "@/lib/calendarFetch";
import { clearSavedCosts, loadSavedCosts, saveCosts } from "@/lib/savedCosts";
import {
  clearSavedData,
  isRemembering,
  loadSavedData,
  saveData,
  setRemembering,
} from "@/lib/savedData";

// The dashboard pulls in Recharts (~470 KB). Nobody sees a chart until they
// have uploaded something, so keep it out of the first paint entirely.
const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center px-s4">
      <p className="text-lg text-muted" role="status">
        Building your dashboard…
      </p>
    </main>
  ),
});

const NO_COSTS: Costs = { monthlyFixed: 0, perStay: 0 };

const SAMPLE_FILES = ["/samples/sample-reservations.csv", "/samples/sample-earnings.csv"];

export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingMore, setAddingMore] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  // Lives here, not in the dashboard, so "Add more files" doesn't wipe it.
  const [costs, setCosts] = useState<Costs>(NO_COSTS);
  // One opt-in covering both the import (IndexedDB) and the costs
  // (localStorage). It starts false so the prerendered HTML matches what the
  // browser first renders — reading storage during render would make the two
  // disagree, and React reports that as an error.
  const [remember, setRemember] = useState(false);
  // True only while the mount effect is fetching a remembered import. Opted-in
  // visitors see one frame of the upload screen first, for the same reason.
  const [restoring, setRestoring] = useState(false);
  // Set when this import came back from the device rather than from a file.
  const [restoredAt, setRestoredAt] = useState<Date | undefined>(undefined);
  // "Not now" on the offer, for this visit only.
  const [offerDeclined, setOfferDeclined] = useState(false);

  /** Add newly parsed data to what's loaded (or replace it, on a fresh start). */
  function commit(parsed: ParsedData[], demo: boolean) {
    // Adding to the example data starts fresh: a host's own stays must never
    // be mixed with the sample's, or inherit its costs.
    const leavingDemo = isDemo && !demo;
    let combined: ParsedData =
      addingMore && data && !isDemo ? data : { reservations: [], payouts: [], blocked: [] };
    for (const p of parsed) combined = mergeParsed(combined, p);
    setData(combined);
    setIsDemo(demo);
    if (demo) {
      setCosts(SAMPLE_COSTS);
    } else if (leavingDemo || (costs.monthlyFixed === 0 && costs.perStay === 0)) {
      const saved = loadSavedCosts();
      setCosts(saved ?? NO_COSTS);
      if (saved) setRemember(true);
    }
    setAddingMore(false);
    // A fresh import replaces whatever was kept; the example data never is.
    setRestoredAt(undefined);
    if (demo) return;
    if (remember) void saveData(combined);
  }

  async function ingest(files: File[], demo = false) {
    setLoading(true);
    setError(null);
    try {
      const parsed: ParsedData[] = [];
      for (const file of files) parsed.push(await parseFile(file));
      commit(parsed, demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCalendar(link: string, listingName: string) {
    setLoading(true);
    setError(null);
    setCalendarError(null);
    try {
      commit([await loadAirbnbCalendar(link, listingName)], false);
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: File[]) {
    return ingest(files, false);
  }

  /** Load the bundled example export so people can see the app work first. */
  async function handleDemo() {
    setLoading(true);
    setError(null);
    try {
      const files = await Promise.all(
        SAMPLE_FILES.map(async (path) => {
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Could not load the example data.`);
          const text = await res.text();
          return new File([text], path.split("/").pop()!, { type: "text/csv" });
        })
      );
      await ingest(files, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  // Runs once, and decides what this visit opens on. The ref guards against
  // React double-invoking effects in development.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // ?demo=1 is the landing page's "See it with example data" link. An
    // explicit ask for the sample beats a remembered import.
    if (new URLSearchParams(window.location.search).has("demo")) {
      // Drop the parameter so a reload, or "start over", lands on the uploader.
      window.history.replaceState(null, "", window.location.pathname);
      void handleDemo();
      return;
    }

    if (!isRemembering()) return;
    setRemember(true);
    setRestoring(true);
    void loadSavedData().then((session) => {
      if (session) {
        setData(session.data);
        setRestoredAt(session.savedAt);
        setCosts(loadSavedCosts() ?? NO_COSTS);
      }
      setRestoring(false);
    });
    // handleDemo is stable for this purpose: it only closes over setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCostsChange(next: Costs) {
    setCosts(next);
    // The demo's numbers are never saved over a host's real ones.
    if (remember && !isDemo) saveCosts(next);
  }

  /** The single consent: it governs the kept import and the kept costs alike. */
  function handleRememberChange(on: boolean) {
    setRemember(on);
    setRemembering(on);
    if (on) {
      saveCosts(costs);
      if (data && !isDemo) void saveData(data);
    } else {
      clearSavedCosts();
      void clearSavedData();
      setRestoredAt(undefined);
    }
  }

  function handleReset() {
    setData(null);
    setError(null);
    setAddingMore(false);
    setIsDemo(false);
    setCosts(NO_COSTS);
    setCalendarError(null);
    setRestoredAt(undefined);
    setOfferDeclined(false);
    // Starting over forgets this import but keeps the preference, so the next
    // one is kept too. Unticking the box is how you stop keeping anything.
    void clearSavedData();
  }

  function handleAddMore() {
    setAddingMore(true);
    setError(null);
    setCalendarError(null);
  }

  function handleCancelAddMore() {
    setAddingMore(false);
    setError(null);
    setCalendarError(null);
  }

  // Opted in, and the kept import is on its way up from IndexedDB.
  if (restoring) {
    return (
      <main className="min-h-screen flex items-center justify-center px-s4">
        <p className="text-lg text-muted" role="status">
          Picking up where you left off…
        </p>
      </main>
    );
  }

  if (data && !addingMore) {
    return (
      <Dashboard
        data={data}
        costs={costs}
        onCostsChange={handleCostsChange}
        remember={isDemo ? undefined : remember}
        onRememberChange={handleRememberChange}
        restoredAt={restoredAt}
        offerRemember={!isDemo && !remember && !restoredAt && !offerDeclined}
        onDeclineRemember={() => setOfferDeclined(true)}
        onReset={handleReset}
        onAddMore={handleAddMore}
        isDemo={isDemo}
        asOf={isDemo ? SAMPLE_AS_OF : undefined}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-s4 py-s7">
      <div className="max-w-xl w-full">
        {addingMore ? (
          <div className="text-center mb-s6">
            <h1 className="text-2xl font-semibold tracking-tight">Add more files</h1>
            <p className="text-sm text-muted mt-s1">
              Another export or calendar is added to what&rsquo;s already loaded.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-s5">
              <p className="text-sm font-medium text-muted mb-s2">HostStats</p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">
                Load your Airbnb exports
              </h1>
              <p className="text-base text-ink-soft mt-s3">
                Drop in the CSVs and you&rsquo;ll get profit after costs, the gap nights between
                stays, your pace against last year and tax-time totals. Everything is read here in
                your browser.
              </p>
            </div>

            <div className="text-center mb-s6">
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="text-base font-medium px-s5 py-s3 rounded bg-interactive text-on-interactive transition-colors duration-fast ease-brand hover:bg-interactive-hover disabled:bg-interactive-disabled-bg disabled:text-interactive-disabled-ink disabled:cursor-not-allowed"
              >
                See it with example data
              </button>
              <p className="text-xs text-muted mt-s2">
                Or use your own Airbnb exports below — they never leave this device.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-ink mt-s7 mb-s3">Use your own data</h2>
          </>
        )}

        <div aria-live="polite">
          {error && (
            <div role="alert" className="state state-danger mb-s4 whitespace-pre-line">
              <AlertCircleIcon className="state-icon" />
              <span>
                <strong className="font-semibold">That didn&rsquo;t work.</strong> {error}
              </span>
            </div>
          )}
        </div>

        <UploadDropzone
          onFiles={handleFiles}
          loading={loading}
          onCancel={addingMore ? handleCancelAddMore : undefined}
        />

        <details className="mt-s3 bg-card rounded border border-line p-s4 text-sm text-ink-soft shadow-1">
          <summary className="cursor-pointer font-medium text-ink rounded-sm">
            Where do I find these files?
          </summary>
          <ol className="mt-s3 space-y-s2 list-decimal list-inside">
            <li>
              On a computer, sign in at{" "}
              <a
                href="https://www.airbnb.com/hosting/reservations"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-interactive-ink hover:text-interactive-ink-hover"
              >
                airbnb.com/hosting
              </a>
              .
            </li>
            <li>
              Open <strong className="font-medium text-ink">Reservations</strong> and click{" "}
              <strong className="font-medium text-ink">Export to CSV</strong>. Save the file.
            </li>
            <li>
              Open <strong className="font-medium text-ink">Earnings</strong> →{" "}
              <strong className="font-medium text-ink">Transaction history</strong> and export that
              too (optional — it adds the money charts).
            </li>
            <li>Come back here and drop both files above.</li>
          </ol>
        </details>

        <div className="mt-s4">
          <CalendarLinkForm onSubmit={handleCalendar} loading={loading} error={calendarError} />
        </div>

        <p className="mt-s5 text-center text-xs text-muted">
          Files are read in your browser and never uploaded. A calendar link is fetched through
          HostStats&rsquo;s server and never stored. Not affiliated with Airbnb.{" "}
          <a href="/privacy/" className="underline hover:text-ink-soft rounded-sm">
            Privacy
          </a>{" "}
          &middot;{" "}
          <a href="/terms/" className="underline hover:text-ink-soft rounded-sm">
            Terms
          </a>{" "}
          &middot;{" "}
          <Link href="/" className="underline hover:text-ink-soft rounded-sm">
            About HostStats
          </Link>
        </p>
      </div>
    </main>
  );
}
