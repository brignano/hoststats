import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – HostStats",
  description:
    "HostStats processes your Airbnb CSV exports entirely in your browser. Nothing is uploaded, stored, or shared.",
  alternates: { canonical: "/privacy/" },
};

/**
 * A real privacy policy page. Any public site should have one, and OAuth
 * providers require a reachable privacy policy URL before they will let an
 * app serve the general public.
 */
export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen px-s4 py-s7">
      <article className="max-w-measure mx-auto bg-card rounded-lg border border-line shadow-1 p-s6 sm:p-s7">
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-s2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-s6">
          For <strong>HostStats</strong>. Last updated 1 November 2026.
        </p>

        <div className="space-y-s5 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">The short version</h2>
            <p>
              HostStats does not collect or share any of your data, and nothing you load is sent to
              a server. Your spreadsheets are read by your own browser and never leave your device.
              Nothing is written to your device either, unless you ask for it: tick &ldquo;Remember
              my data on this device&rdquo; and it is kept in your own browser so you need not
              upload again. The one other exception is an Airbnb calendar link, if you choose to
              paste one — both are described below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">
              What happens to the files you upload
            </h2>
            <p>
              When you drop a CSV onto HostStats, your browser reads it locally and calculates your
              statistics on your own machine. The file is never sent to a server — HostStats has no
              database, and its only server code is the calendar fetch described below.
            </p>
            <p className="mt-s3">
              By default nothing is written to your device. Close or refresh the tab and your stays
              and statistics are gone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">
              Remembering your data on this device
            </h2>
            <p>
              Uploading the same export on every visit gets old, so HostStats can keep it — but only
              if you tick{" "}
              <strong className="font-medium text-ink">Remember my data on this device</strong>.
              Until you do, nothing is stored.
            </p>
            <p className="mt-s3">
              With it ticked, two things are saved in your own browser: the stays and payouts from
              your import, in its IndexedDB storage, and your two cost figures, in its local
              storage. Both stay on that device. Neither is sent anywhere, because there is nowhere
              to send them — HostStats still has no database and no accounts.
            </p>
            <p className="mt-s3">
              <strong className="font-medium text-ink">Guest names are never saved.</strong> Airbnb
              puts your guests&rsquo; names in the reservations export, and HostStats does not
              display or use them, so they are stripped out before anything is written down.
            </p>
            <p className="mt-s3">
              To delete it: untick the box, which erases both straight away, or press{" "}
              <strong className="font-medium text-ink">Start over</strong>, which forgets the
              current import but keeps the setting for your next one. Clearing your browser&rsquo;s
              site data for HostStats removes everything either way. On a shared or public computer,
              leave the box unticked.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Airbnb calendar links</h2>
            <p>
              If you paste a listing&rsquo;s calendar link, your browser sends that link to
              HostStats&rsquo;s own server, which downloads the calendar from Airbnb and passes it
              straight back to you. This step exists only because Airbnb does not let a web page
              read the calendar directly.
            </p>
            <p className="mt-s3">
              The link and the calendar are not stored, cached, or logged. The link travels in the
              body of the request rather than its address, so it does not appear in request logs,
              and the server only ever fetches Airbnb calendar addresses. Airbnb&rsquo;s calendar
              holds booked and blocked dates and a booking reference — no prices, and no guest
              names. It is read in your browser like the spreadsheets, and is kept afterwards only
              on the same opt-in terms as everything else above.
            </p>
            <p className="mt-s3">
              Anyone with the link can see your booked dates, so treat it like a password. You can
              reset it in Airbnb from the same screen you copied it from.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Analytics and tracking</h2>
            <p>
              There are none. No analytics, no tracking pixels, no advertising identifiers, no
              third-party scripts, and no cookies set by the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Hosting</h2>
            <p>
              The site is served by Cloudflare, as static files plus the calendar fetch above. As
              with any web host, Cloudflare processes standard request data such as IP addresses in
              order to deliver the page and protect against abuse. This is handled under{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-interactive-ink underline hover:text-interactive-ink-hover"
              >
                Cloudflare&rsquo;s privacy policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Contact</h2>
            <p>
              Questions about this policy can go to{" "}
              <a
                href="mailto:hi@brignano.io"
                className="text-interactive-ink underline hover:text-interactive-ink-hover"
              >
                hi@brignano.io
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Not affiliated with Airbnb</h2>
            <p>
              HostStats is an independent open-source tool. It is not affiliated with, endorsed by,
              or sponsored by Airbnb, Inc.
            </p>
          </section>
        </div>

        <div className="mt-s7 pt-s5 border-t border-line flex flex-wrap gap-s4">
          <Link
            href="/"
            className="text-interactive-ink underline hover:text-interactive-ink-hover rounded-sm"
          >
            ← About HostStats
          </Link>
          <Link
            href="/app/"
            className="text-interactive-ink underline hover:text-interactive-ink-hover rounded-sm"
          >
            Open the dashboard
          </Link>
        </div>
      </article>
    </main>
  );
}
