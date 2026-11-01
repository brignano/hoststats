import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use – HostStats",
  description:
    "The terms for using HostStats: free, open source under the MIT licence, provided as-is, with no account and no data kept.",
  alternates: { canonical: "/terms/" },
};

/**
 * Plain-language terms. A product page's legal line links Privacy and Terms
 * (DESIGN.md §13), and a public tool that touches someone's earnings data ought
 * to say plainly what it does and does not promise.
 */
export default function Terms() {
  return (
    <main className="min-h-screen px-s4 py-s7">
      <article className="max-w-measure mx-auto bg-card rounded-lg border border-line shadow-1 p-s6 sm:p-s7">
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-s2">Terms of Use</h1>
        <p className="text-sm text-muted mb-s6">
          For <strong>HostStats</strong>. Last updated 31 October 2026.
        </p>

        <div className="space-y-s5 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">The short version</h2>
            <p>
              HostStats is a free, open-source tool offered as-is. It reads spreadsheets you already
              have and shows you sums based on them. There is no account, no subscription and no
              data kept on a server. Check anything that matters before you act on it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">What you are agreeing to</h2>
            <p>
              By using HostStats you accept these terms. If you do not accept them, do not use it.
              The software itself is licensed separately and much more permissively, under the MIT
              licence — see{" "}
              <a
                href="https://github.com/brignano/hoststats/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-interactive-ink underline hover:text-interactive-hover"
              >
                the licence in the repository
              </a>
              . You are free to read the source, run your own copy and change it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">
              The numbers are a starting point, not advice
            </h2>
            <p>
              HostStats is not an accountant, a tax adviser, a lawyer or a pricing service. The
              profit, break-even, pace and tax figures it shows are arithmetic performed on the
              files you give it, and they are only as good as those files. The tax summary in
              particular is a convenience for a conversation with a professional, not a return, and
              it reflects a reading of US rules that may not apply to you.
            </p>
            <p className="mt-s3">
              Decisions about your prices, your calendar and your taxes remain yours. Check the
              figures against your own records before you rely on them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">No warranty</h2>
            <p>
              HostStats is provided &ldquo;as is&rdquo;, without warranty of any kind, express or
              implied, including but not limited to the warranties of merchantability, fitness for a
              particular purpose and non-infringement. To the fullest extent permitted by law,
              neither the author nor any contributor is liable for any claim, damages or other
              liability — including any lost income, mispriced night or tax consequence — arising
              from the use of, or inability to use, HostStats.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Your data</h2>
            <p>
              Your files are read in your browser and are never uploaded. If you tick
              &ldquo;Remember my data on this device&rdquo;, your import and costs are kept in that
              browser — on your device, never on ours, and never with your guests&rsquo; names.
              Keeping them, and deleting them, is yours to control. The one exception to all of this
              is an Airbnb calendar link, if you choose to paste one, which is fetched through a
              pass-through proxy that stores and logs nothing. The{" "}
              <Link
                href="/privacy/"
                className="text-interactive-ink underline hover:text-interactive-hover"
              >
                privacy policy
              </Link>{" "}
              describes all of this in detail and forms part of these terms.
            </p>
            <p className="mt-s3">
              A calendar link lets anyone holding it see your booked dates. Treat it like a
              password, and reset it in Airbnb if you share it by accident.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Fair use of the calendar fetch</h2>
            <p>
              The calendar proxy exists so that hosts without a CSV export can still use HostStats.
              Please do not use it to scrape calendars in bulk, to fetch anything other than your
              own listings, or to put automated load on it. It may be rate-limited, changed or
              withdrawn at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Not affiliated with Airbnb</h2>
            <p>
              HostStats is an independent open-source project. It is not affiliated with, endorsed
              by, or sponsored by Airbnb, Inc., and &ldquo;Airbnb&rdquo; is a trademark of its
              owner. Your use of Airbnb and of the exports you download from it stays governed by
              your own agreement with Airbnb — including whatever that says about automated access.
              Nothing here changes it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Availability and changes</h2>
            <p>
              There is no uptime promise. HostStats is a free tool that may change, break or stop
              being hosted without notice; because it is open source, you can always run your own
              copy. These terms may be updated, and the date at the top of this page says when they
              last were. Continuing to use HostStats after a change means accepting it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-ink mb-s2">Contact</h2>
            <p>
              Questions about these terms can go to{" "}
              <a
                href="mailto:hi@brignano.io"
                className="text-interactive-ink underline hover:text-interactive-hover"
              >
                hi@brignano.io
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-s7 pt-s5 border-t border-line flex flex-wrap gap-s4">
          <Link
            href="/"
            className="text-interactive-ink underline hover:text-interactive-hover rounded-sm"
          >
            ← About HostStats
          </Link>
          <Link
            href="/app/"
            className="text-interactive-ink underline hover:text-interactive-hover rounded-sm"
          >
            Open the dashboard
          </Link>
        </div>
      </article>
    </main>
  );
}
