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
    <main className="min-h-screen px-s4 py-s7">
      <article className="max-w-measure mx-auto bg-card rounded-lg border border-line shadow-1 p-s6 sm:p-s7">
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-s2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-s6">
          For <strong>HostStats</strong>. Last updated 12 October 2026.
        </p>

        <div className="space-y-s5 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">The short version</h2>
            <p>
              HostStats does not collect, store, or share any of your data. Your spreadsheets are
              read by your own browser and never leave your device. The one exception is an Airbnb
              calendar link, if you choose to paste one — see below.
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
              Your files and statistics are not written to disk. Close or refresh the tab and they
              are gone. There is no &ldquo;delete my data&rdquo; process because nothing was ever
              kept.
            </p>
            <p className="mt-s3">
              The one thing HostStats can keep, and only if you ask, is your two cost figures: tick
              &ldquo;Remember my costs on this device&rdquo; and they are saved in your
              browser&rsquo;s local storage so you don&rsquo;t retype them next time. They stay on
              that device, are never sent anywhere, and untick the box (or clear your browser data)
              to delete them.
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
              names. It is read in your browser like the spreadsheets and is gone when you close the
              tab.
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
            <h2 className="text-lg font-medium text-ink mb-s2">Signing in</h2>
            <p>
              This site may sit behind Cloudflare Access, which asks you to sign in before the page
              loads. That is usually a one-time code emailed to you; it may instead be a third-party
              provider such as Google, which tells Cloudflare your name and email address so it can
              check you are on the guest list.
            </p>
            <p className="mt-s3">
              Either way the exchange happens between Cloudflare and your email or identity
              provider. HostStats itself does not receive, read, or store your identity, and the
              sign-in check happens before the application runs at all. It never has access to your
              spreadsheets.
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
                className="text-interactive-ink underline hover:text-interactive-hover"
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
                className="text-interactive-ink underline hover:text-interactive-hover"
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

        <div className="mt-s7 pt-s5 border-t border-line">
          <Link
            href="/"
            className="text-interactive-ink underline hover:text-interactive-hover rounded-sm"
          >
            ← Back to HostStats
          </Link>
        </div>
      </article>
    </main>
  );
}
