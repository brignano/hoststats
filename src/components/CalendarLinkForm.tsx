"use client";

import { useState } from "react";
import { AlertCircleIcon } from "./icons";

interface Props {
  onSubmit: (link: string, listingName: string) => Promise<void>;
  loading: boolean;
  /** Shown here rather than at the top of the page, where it would be off-screen on a phone. */
  error?: string | null;
}

const inputClass =
  "w-full rounded-sm border border-line-strong bg-card text-ink px-s3 py-s2 text-base";

/**
 * Paste-a-link import. Airbnb has no public API or OAuth for outside apps,
 * but every listing has a calendar export link, and that's enough to see
 * upcoming stays and the gaps between them.
 */
export default function CalendarLinkForm({ onSubmit, loading, error }: Props) {
  const [link, setLink] = useState("");
  const [name, setName] = useState("");

  return (
    <form
      className="bg-card rounded border border-line shadow-1 p-s5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!link.trim()) return;
        await onSubmit(link, name);
      }}
    >
      <h2 className="text-base font-medium text-ink mb-s1">Or paste your calendar link</h2>
      <p className="text-xs text-muted mb-s4">
        Shows upcoming stays and the gap nights you can still fill. No prices — add the CSVs for
        those.
      </p>

      <label htmlFor="calendar-link" className="block text-sm font-medium text-ink mb-s1">
        Airbnb calendar link
      </label>
      <input
        id="calendar-link"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://www.airbnb.com/calendar/ical/…"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className={`${inputClass} font-mono text-sm`}
      />

      <label htmlFor="calendar-name" className="block text-sm font-medium text-ink mt-s3 mb-s1">
        Listing name <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id="calendar-name"
        type="text"
        autoComplete="off"
        placeholder="Beach House"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />

      <div aria-live="polite">
        {error && (
          <div role="alert" className="state state-danger mt-s4">
            <AlertCircleIcon className="state-icon" />
            <span>
              <strong className="font-semibold">That didn&rsquo;t work.</strong> {error}
            </span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !link.trim()}
        className="mt-s4 w-full text-sm px-s4 py-s3 rounded bg-interactive text-on-interactive font-medium transition-colors duration-fast ease-brand hover:bg-interactive-hover disabled:bg-interactive-disabled-bg disabled:text-interactive-disabled-ink disabled:cursor-not-allowed"
      >
        {loading ? "Loading calendar…" : "Load calendar"}
      </button>

      <details className="mt-s4 text-sm text-ink-soft">
        <summary className="cursor-pointer font-medium text-ink rounded-sm">
          Where do I find it?
        </summary>
        <ol className="mt-s2 space-y-s1 list-decimal list-inside">
          <li>
            On airbnb.com, open <strong className="font-medium text-ink">Listings</strong> and pick
            the listing.
          </li>
          <li>
            Go to <strong className="font-medium text-ink">Availability</strong> →{" "}
            <strong className="font-medium text-ink">Connect calendars</strong> (sometimes called
            Calendar sync).
          </li>
          <li>
            Choose <strong className="font-medium text-ink">Export calendar</strong> and copy the
            link.
          </li>
        </ol>
        <p className="mt-s2 text-xs text-muted">
          Treat the link like a password: anyone with it can see your booked dates. Airbnb can reset
          it from the same screen. HostStats fetches it once through its own server because Airbnb
          won&rsquo;t let a web page read it directly, and never stores or logs it.
        </p>
      </details>
    </form>
  );
}
