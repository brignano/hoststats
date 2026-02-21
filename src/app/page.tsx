"use client";

import { useState } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import Dashboard from "@/components/Dashboard";
import { ParsedData } from "@/lib/models";
import { parseFile } from "@/lib/importers";

export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: File[]) {
    setLoading(true);
    setError(null);
    try {
      let combined: ParsedData = { reservations: [], payouts: [] };
      for (const file of files) {
        const result = await parseFile(file);
        combined = {
          reservations: [...combined.reservations, ...result.reservations],
          payouts: [...combined.payouts, ...result.payouts],
        };
      }
      setData(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setData(null);
    setError(null);
  }

  if (data) {
    return <Dashboard data={data} onReset={handleReset} />;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🏡 HostStats
          </h1>
          <p className="text-xl text-gray-600">
            See how your Airbnb is doing — no account needed.
          </p>
          <p className="text-base text-gray-500 mt-2">
            Upload your Airbnb CSV exports and instantly get your stats.
            Everything stays on your device.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Oops!</strong> {error}
          </div>
        )}

        <UploadDropzone onFiles={handleFiles} loading={loading} />

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Not sure which files to download?{" "}
            <a
              href="https://www.airbnb.com/hosting/reservations"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Go to Airbnb Hosting
            </a>{" "}
            → Reservations or Earnings → Export CSV.
          </p>
          <p className="mt-2 text-xs text-gray-300">
            HostStats is not affiliated with Airbnb.
          </p>
        </div>
      </div>
    </main>
  );
}
