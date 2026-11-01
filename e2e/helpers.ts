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

/** Open the example dashboard from the tool at /app/ (the product page is /). */
export async function openDemo(page: Page) {
  await page.goto("/app/");
  await page.getByRole("button", { name: "See it with example data" }).click();
  await expect(page.getByRole("heading", { name: "What to do now" })).toBeVisible();
}

export async function expectNoSideScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}

/**
 * The record HostStats kept in this browser's IndexedDB, or null if there is
 * none. Opens with the same name, version and store as src/lib/savedData.ts —
 * and creates the store if it is missing, exactly as the app does. Opening
 * without a version would create a store-less database at version 1, which the
 * app could then never upgrade, so its writes would silently do nothing.
 */
export async function storedRecord(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("hoststats", 1);
        open.onupgradeneeded = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("session")) db.createObjectStore("session");
        };
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const db = open.result;
          const request = db
            .transaction("session", "readonly")
            .objectStore("session")
            .get("current");
          request.onsuccess = () => {
            const value = request.result ?? null;
            db.close();
            resolve(value);
          };
          request.onerror = () => {
            db.close();
            resolve(null);
          };
        };
      })
  );
}
