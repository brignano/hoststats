import { expect, Page } from "@playwright/test";

/** Fail the test on any uncaught error or console.error from the page. */
export function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

export async function openDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "See it with example data" }).click();
  await expect(page.getByRole("heading", { name: "What to do now" })).toBeVisible();
}

export async function expectNoSideScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}
