import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import { openDemo } from "./helpers";

/**
 * Zero axe violations, in both themes, at desktop and phone widths. The
 * design system's floor (DESIGN.md §9) is 4.5:1 for body text; this is what
 * keeps a faint grey from creeping back in.
 */

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(", ")}`
  );
  expect(summary, "accessibility violations").toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [1100, 390]) {
    test.describe(`${colorScheme}, ${width}px`, () => {
      test.use({ colorScheme, viewport: { width, height: 900 } });

      test("landing page", async ({ page }) => {
        await page.goto("/");
        await expectNoViolations(page);
      });

      test("dashboard", async ({ page }) => {
        await openDemo(page);
        await page.getByText(/See every gap/).click(); // include the opened list
        await expectNoViolations(page);
      });
    });
  }
}

test("privacy page", async ({ page }) => {
  await page.goto("/privacy/");
  await expectNoViolations(page);
});
