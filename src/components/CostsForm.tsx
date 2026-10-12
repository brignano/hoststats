"use client";

import { Costs } from "@/lib/models";

interface Props {
  costs: Costs;
  onChange: (costs: Costs) => void;
  /** Whether the costs are saved on this device. Omit to hide the option (the demo). */
  remember?: boolean;
  onRememberChange?: (remember: boolean) => void;
}

const inputClass =
  "w-full rounded-sm border border-line-strong bg-card text-ink font-mono tabular-nums pl-s5 pr-s3 py-s2 text-base";

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-s1">
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-s3 top-1/2 -translate-y-1/2 text-slate font-mono"
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="0"
          value={value === 0 ? "" : value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) && n > 0 ? n : 0);
          }}
          aria-describedby={`${id}-hint`}
          className={inputClass}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate mt-s1">
        {hint}
      </p>
    </div>
  );
}

/**
 * The one thing Airbnb can't know: what the place costs to run.
 *
 * Held in React state unless the host opts in to keeping them on this
 * device (see lib/savedCosts). The privacy policy describes both.
 */
export default function CostsForm({ costs, onChange, remember, onRememberChange }: Props) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s1">Your costs</h3>
      <p className="text-xs text-slate mb-s4">
        Airbnb shows payouts, not profit. Rough numbers are fine.
        {!remember && " They stay in this tab."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-s4">
        <MoneyField
          id="cost-fixed"
          label="Every month"
          hint="Mortgage or rent, utilities, insurance, internet"
          value={costs.monthlyFixed}
          onChange={(monthlyFixed) => onChange({ ...costs, monthlyFixed })}
        />
        <MoneyField
          id="cost-stay"
          label="Every stay"
          hint="Cleaning, laundry, restocking"
          value={costs.perStay}
          onChange={(perStay) => onChange({ ...costs, perStay })}
        />
      </div>
      {remember !== undefined && onRememberChange && (
        <label className="mt-s4 flex items-start gap-s2 text-sm text-ink-soft cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onRememberChange(e.target.checked)}
            className="mt-[3px] h-4 w-4 accent-[var(--i)]"
          />
          <span>
            Remember my costs on this device
            <span className="block text-xs text-slate">
              Saved in this browser only — never sent anywhere. Untick to delete them.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
