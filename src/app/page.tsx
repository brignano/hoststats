"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadDropzone from "@/components/UploadDropzone";
import { AlertCircleIcon } from "@/components/icons";
import { ParsedData } from "@/lib/models";
import { parseFile } from "@/lib/importers";

// The dashboard pulls in Recharts (~470 KB). Nobody sees a chart until they
// have uploaded something, so keep it out of the first paint entirely.
const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center px-s4">
      <p className="text-lg text-slate" role="status">
        Building your dashboard…
      </p>
    </main>
  ),
});

const SAMPLE_FILES = ["/samples/sample-reservations.csv", "/samples/sample-earnings.csv"];

export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingMore, setAddingMore] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  async function ingest(files: File[], demo = false) {
    setLoading(true);
    setError(null);
    try {
      let combined: ParsedData =
        addingMore && data
          ? { reservations: [...data.reservations], payouts: [...data.payouts] }
          : { reservations: [], payouts: [] };
      for (const file of files) {
        const result = await parseFile(file);
        combined = {
          reservations: [...combined.reservations, ...result.reservations],
          payouts: [...combined.payouts, ...result.payouts],
        };
      }
      setData(combined);
      setIsDemo(demo);
      setAddingMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

  function handleReset() {
    setData(null);
    setError(null);
    setAddingMore(false);
    setIsDemo(false);
  }

  function handleAddMore() {
    setAddingMore(true);
    setError(null);
  }

  function handleCancelAddMore() {
    setAddingMore(false);
    setError(null);
  }

  if (data && !addingMore) {
    const hasBothFiles = data.reservations.length > 0 && data.payouts.length > 0;
    return (
      <Dashboard
        data={data}
        onReset={handleReset}
        onAddMore={handleAddMore}
        disableAddMore={hasBothFiles}
        isDemo={isDemo}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-s4 py-s7">
      <div className="max-w-xl w-full">
        <div className="text-center mb-s6">
          <h1 className="text-3xl font-semibold tracking-tight mb-s2">HostStats</h1>
          <p className="text-lg text-ink-soft">See how your Airbnb is doing — no account needed.</p>
          <p className="text-sm text-slate mt-s2">
            Upload your Airbnb CSV exports and instantly get your stats. Everything stays on your
            device.
          </p>
        </div>

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

        {!addingMore && (
          <div className="mt-s3 text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="text-sm px-s4 py-s3 rounded border border-line-strong bg-card text-ink-soft transition-colors duration-fast ease-brand hover:bg-surface-hover hover:text-ink disabled:bg-interactive-disabled-bg disabled:text-interactive-disabled-ink disabled:cursor-not-allowed"
            >
              Not ready yet? See it with example data
            </button>
          </div>
        )}

        <details className="mt-s5 bg-card rounded border border-line p-s4 text-sm text-ink-soft shadow-1">
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
                className="underline text-interactive-ink hover:text-interactive-hover"
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

        <p className="mt-s5 text-center text-xs text-slate">
          Your files never leave your device. HostStats is not affiliated with Airbnb.{" "}
          <a href="/privacy/" className="underline hover:text-ink-soft rounded-sm">
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}
