"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadDropzone from "@/components/UploadDropzone";
import { ParsedData } from "@/lib/models";
import { parseFile } from "@/lib/importers";

// The dashboard pulls in Recharts (~470 KB). Nobody sees a chart until they
// have uploaded something, so keep it out of the first paint entirely.
const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <p className="text-lg text-gray-500" role="status">
        Building your dashboard…
      </p>
    </main>
  ),
});

const SAMPLE_FILES = [
  "/samples/sample-reservations.csv",
  "/samples/sample-earnings.csv",
];

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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🏡 HostStats</h1>
          <p className="text-xl text-gray-600">
            See how your Airbnb is doing — no account needed.
          </p>
          <p className="text-base text-gray-500 mt-2">
            Upload your Airbnb CSV exports and instantly get your stats.
            Everything stays on your device.
          </p>
        </div>

        <div aria-live="polite">
          {error && (
            <div
              role="alert"
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-line"
            >
              <strong>Oops!</strong> {error}
            </div>
          )}
        </div>

        <UploadDropzone
          onFiles={handleFiles}
          loading={loading}
          onCancel={addingMore ? handleCancelAddMore : undefined}
        />

        {!addingMore && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="text-base px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👀 Not ready yet? See it with example data
            </button>
          </div>
        )}

        <details className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
            Where do I find these files?
          </summary>
          <ol className="mt-3 space-y-2 list-decimal list-inside">
            <li>
              On a computer, sign in at{" "}
              <a
                href="https://www.airbnb.com/hosting/reservations"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-brand"
              >
                airbnb.com/hosting
              </a>
              .
            </li>
            <li>
              Open <strong>Reservations</strong> and click{" "}
              <strong>Export to CSV</strong>. Save the file.
            </li>
            <li>
              Open <strong>Earnings</strong> → <strong>Transaction history</strong>{" "}
              and export that too (optional — it adds the money charts).
            </li>
            <li>Come back here and drop both files above.</li>
          </ol>
        </details>

        <p className="mt-6 text-center text-xs text-gray-400">
          Your files never leave your device. HostStats is not affiliated with
          Airbnb.{" "}
          <a
            href="/privacy/"
            className="underline hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}
