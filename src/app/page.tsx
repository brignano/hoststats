import Link from "next/link";

import { FEATURES } from "@/lib/features";

/**
 * The product page, built to DESIGN.md §13 in @brignano/design: one argument,
 * one ask, in a fixed band order — header, hero, story, close, footer.
 *
 * This is the one MARKETING-tier surface in HostStats. `.tier-marketing` only
 * redefines custom properties and those inherit, so it rides on this page's own
 * wrapper rather than on <html>, which the tool at /app/ shares (§2). The
 * `.pp-*` structure comes from product-page.css, imported in globals.css.
 *
 * A server component on purpose: no client JS, no Recharts, nothing to hydrate.
 */

// How to open the product. The secondary action loads the bundled example
// export, which is the nearest thing to a live demo in the proof slot — the
// site sends X-Frame-Options: DENY, so the app cannot be embedded in an iframe.
const OPEN = "/app/";
const DEMO = "/app/?demo=1";

const STEPS = [
  {
    title: "Export from Airbnb",
    body: "Reservations as CSV, and the transaction history too if you want the money charts.",
  },
  {
    title: "Drop them in",
    body: "Your browser reads them. No account to make, and no upload — or paste a calendar link instead.",
  },
  {
    title: "Read the answer",
    body: "What to do now sits at the top: the gap nights to open up, the month falling behind, the prices to set.",
  },
];

export default function ProductPage() {
  // The build's clock. §13 forbids both typing the year by hand, where it goes
  // stale every January, and writing it from client script, where it flashes.
  const year = new Date().getFullYear();

  return (
    <div className="pp tier-marketing">
      <a className="pp-skip" href="#main">
        Skip to content
      </a>

      <header className="pp-header">
        <div className="pp-wrap">
          <Link className="pp-brand" href="/">
            HostStats
          </Link>
          <nav className="pp-nav" aria-label="On this page">
            <a href="#problem">The problem</a>
            <a href="#see">What you see</a>
            <a href="#privacy">Your data</a>
          </nav>
          <div className="pp-header-actions">
            <span className="pp-status" data-state="open">
              Free &middot; open source
            </span>
            <Link className="pp-button is-small" href={OPEN}>
              Open HostStats
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="pp-hero">
          <div className="pp-wrap">
            <div>
              <span className="pp-status" data-state="open">
                Free &middot; open source
              </span>
              <h1 className="pp-thesis">
                What your Airbnb really earns, and where it&rsquo;s leaking money.
              </h1>
              <p className="pp-subhead">
                Airbnb shows you payouts. HostStats shows profit after your costs, the empty nights
                stranded between stays, and whether next month is filling as fast as last year.
                It&rsquo;s free and open source, and there is no account.
              </p>
              <p className="pp-actions">
                <Link className="pp-button" href={OPEN}>
                  Open HostStats
                </Link>
                <Link className="pp-button is-secondary" href={DEMO}>
                  See it with example data
                </Link>
              </p>
              <p className="pp-note">
                Your spreadsheets are read in your browser and never uploaded.
              </p>
            </div>

            {/*
              The proof slot is the product: a real screenshot of the dashboard
              on the bundled example data, captured from the built site. Two of
              them, swapped by the reader's theme in plain HTML, because a
              light-mode screenshot in a dark-mode frame reads as a mistake.
            */}
            <figure className="pp-media">
              <picture>
                <source srcSet="/dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                <img
                  src="/dashboard-light.png"
                  width={900}
                  height={580}
                  alt="The HostStats dashboard on example data: a what-to-do-now list, profit after costs, and the gap nights between stays."
                />
              </picture>
            </figure>
          </div>
        </section>

        <ol className="pp-story">
          <li className="pp-chapter" id="problem">
            <div className="pp-wrap">
              <p className="pp-label">The problem</p>
              <div className="pp-chapter-body">
                <h2>Airbnb tells you what it paid you, not what you kept.</h2>
                <p>
                  Your payout is not your profit. Cleaning, laundry, supplies, the mortgage, the
                  utilities and the management fee all come out of it, and Airbnb knows about none
                  of them. So the number on the dashboard is the one number a host cannot make a
                  decision with.
                </p>
                <p>
                  The gaps are worse. A single night stranded between two stays almost never sells,
                  and nothing tells you it is there while you can still do something about it. Nor
                  does anything tell you that next August is fifteen nights behind the August you
                  had last year — until August.
                </p>
              </div>
            </div>
          </li>

          <li className="pp-chapter" id="see">
            <div className="pp-wrap">
              <p className="pp-label">What you see</p>
              <div className="pp-chapter-body">
                <h2>Four answers, in the words you would use yourself.</h2>
                <p>
                  Each one is a sentence, not a chart to interpret. These are the real lines from
                  the example data, so you can judge it before you go looking for your exports.
                </p>
                <ul className="pp-points">
                  {FEATURES.map((f) => (
                    <li key={f.title}>
                      <h3>{f.title}</h3>
                      <p>{f.body}</p>
                      <span className="block mt-s2 font-mono text-xs text-muted">{f.example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>

          <li className="pp-chapter" id="how">
            <div className="pp-wrap">
              <p className="pp-label">How it works</p>
              <div className="pp-chapter-body">
                <h2>Three steps, and the longest one is finding the download button.</h2>
                <ul className="pp-points">
                  {STEPS.map((s) => (
                    <li key={s.title}>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>

          <li className="pp-chapter" id="privacy">
            <div className="pp-wrap">
              <p className="pp-label">Your data</p>
              <div className="pp-chapter-body">
                <h2>It stays on your device, because there is nowhere else for it to go.</h2>
                <p>
                  HostStats has no database and no accounts. Your CSVs are parsed by your own
                  browser and are gone when you close the tab, unless you ask it to remember them —
                  and then they are kept in that browser, on that device, with your guests&rsquo;
                  names stripped out. There are no analytics, no tracking pixels and no third-party
                  scripts.
                </p>
                <p>
                  The one exception is a calendar link, if you choose to paste one: Airbnb will not
                  let a web page read a calendar directly, so it is fetched through a small
                  pass-through proxy that stores and logs nothing. The whole thing is{" "}
                  <a
                    href="https://github.com/brignano/hoststats"
                    className="text-interactive-ink underline hover:text-interactive-ink-hover"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    open source
                  </a>
                  , so none of this has to be taken on trust.
                </p>
              </div>
            </div>
          </li>
        </ol>

        <section className="pp-close" id="start">
          <div className="pp-wrap">
            <div>
              <span className="pp-status" data-state="open">
                Free &middot; open source
              </span>
              <h2>See what a month actually made you.</h2>
              <p className="pp-subhead">
                Free, open source, and no account — so the only thing between you and the answer is
                finding your last CSV export.
              </p>
            </div>
            <div className="pp-panel">
              <p className="pp-actions">
                <Link className="pp-button" href={OPEN}>
                  Open HostStats
                </Link>
                <Link className="pp-button is-secondary" href={DEMO}>
                  See it with example data
                </Link>
              </p>
              <p className="pp-note">
                Nothing to install and nothing to sign up for. Your files are read in your browser
                and never uploaded; a calendar link is fetched once and never stored.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="pp-footer">
        <div className="pp-wrap">
          <p>
            <Link className="pp-brand" href="/">
              HostStats
            </Link>
            <span>What your Airbnb really earns, after what it costs you.</span>
          </p>
          <nav aria-label="More">
            <Link href={OPEN}>Open the dashboard</Link>
            <a
              href="https://github.com/brignano/hoststats"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source
            </a>
            <a href="mailto:hi@brignano.io">Contact</a>
          </nav>
          <div className="pp-legal">
            <small>&copy; {year} Anthony Brignano. All rights reserved.</small>
            <nav aria-label="Legal">
              <Link href="/privacy/">Privacy</Link>
              <Link href="/terms/">Terms</Link>
            </nav>
          </div>
          <p className="pp-legal">
            <small>
              Not affiliated with, endorsed by, or sponsored by Airbnb, Inc. &ldquo;Airbnb&rdquo; is
              a trademark of Airbnb, Inc.
            </small>
          </p>
        </div>
      </footer>
    </div>
  );
}
