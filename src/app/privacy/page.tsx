import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – HostStats",
  description:
    "HostStats processes your Airbnb CSV exports entirely in your browser. Nothing is uploaded, stored, or shared.",
};

/**
 * A real privacy policy page. Any public site should have one, and OAuth
 * providers require a reachable privacy policy URL before they will let an
 * app serve the general public.
 */
export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <article className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          For <strong>HostStats</strong>. Last updated 23 August 2026.
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">The short version</h2>
            <p>
              HostStats does not collect, transmit, store, or share any of your data. Your
              spreadsheets are read by your own browser and never leave your device.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              What happens to the files you upload
            </h2>
            <p>
              When you drop a CSV onto HostStats, your browser reads it locally and calculates your
              statistics on your own machine. The file is never sent to a server, because there is
              no server to send it to — HostStats is a static website with no backend and no
              database.
            </p>
            <p className="mt-3">
              Nothing is written to disk. Close or refresh the tab and the data is gone. There is no
              &ldquo;delete my data&rdquo; process because nothing was ever kept.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics and tracking</h2>
            <p>
              There are none. No analytics, no tracking pixels, no advertising identifiers, no
              third-party scripts, and no cookies set by the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing in</h2>
            <p>
              This site may sit behind Cloudflare Access, which asks you to sign in before the page
              loads. That is usually a one-time code emailed to you; it may instead be a third-party
              provider such as Google, which tells Cloudflare your name and email address so it can
              check you are on the guest list.
            </p>
            <p className="mt-3">
              Either way the exchange happens between Cloudflare and your email or identity
              provider. HostStats itself does not receive, read, or store your identity, and the
              sign-in check happens before the application runs at all. It never has access to your
              spreadsheets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Hosting</h2>
            <p>
              The site is served as static files by Cloudflare. As with any web host, Cloudflare
              processes standard request data such as IP addresses in order to deliver the page and
              protect against abuse. This is handled under{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                Cloudflare&rsquo;s privacy policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions about this policy can go to{" "}
              <a href="mailto:hi@brignano.io" className="text-brand underline">
                hi@brignano.io
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Not affiliated with Airbnb</h2>
            <p>
              HostStats is an independent open-source tool. It is not affiliated with, endorsed by,
              or sponsored by Airbnb, Inc.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link
            href="/"
            className="text-brand underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            ← Back to HostStats
          </Link>
        </div>
      </article>
    </main>
  );
}
