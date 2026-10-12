import { Costs } from "./models";

/**
 * The example data's settings, shared by the demo and by the test that
 * keeps the landing page's example lines honest.
 */

/** Plausible costs for the example beach house, so the demo shows profit straight away. */
export const SAMPLE_COSTS: Costs = { monthlyFixed: 2200, perStay: 120 };

/** The example data runs 2024–2025; pacing needs a "today" with a future after it. */
export const SAMPLE_AS_OF = new Date(2025, 5, 1);
