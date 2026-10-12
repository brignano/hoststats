"use client";

import { Action } from "@/lib/actions";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "./icons";

interface Props {
  actions: Action[];
}

/**
 * The top of the dashboard: what to act on now, each line linking down to
 * the section that explains it. The tone comes with an icon as well as a
 * colour, so it still reads in greyscale (DESIGN.md §3).
 */
export default function NextActions({ actions }: Props) {
  return (
    <section
      aria-labelledby="next-actions-heading"
      className="bg-card rounded border border-line-strong shadow-1 p-s5 mb-s7"
    >
      <h2 id="next-actions-heading" className="text-lg font-semibold text-ink">
        What to do now
      </h2>

      {actions.length === 0 ? (
        <p className="mt-s3 flex items-start gap-s2 text-sm text-ink-soft">
          <CheckCircleIcon className="w-[1.125rem] h-[1.125rem] mt-[1px] shrink-0 text-success-ink" />
          <span>
            Nothing urgent. No stranded nights coming up and no month falling behind — the sections
            below have the detail.
          </span>
        </p>
      ) : (
        <ol className="mt-s3 divide-y divide-line">
          {actions.map((a) => (
            <li key={a.id} className="flex items-start gap-s3 py-s3 first:pt-0 last:pb-0">
              {a.tone === "attention" ? (
                <AlertTriangleIcon className="w-[1.125rem] h-[1.125rem] mt-[2px] shrink-0 text-attention-ink" />
              ) : (
                <InfoIcon className="w-[1.125rem] h-[1.125rem] mt-[2px] shrink-0 text-[var(--info-ink)]" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{a.title}</p>
                <p className="text-sm text-ink-soft mt-s1">{a.detail}</p>
                <a
                  href={a.href}
                  className="inline-block mt-s1 text-sm text-interactive-ink underline hover:text-interactive-hover rounded-sm"
                >
                  {a.linkLabel} →
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
