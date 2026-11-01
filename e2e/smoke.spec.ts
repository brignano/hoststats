import { expect, test } from "@playwright/test";
import { expectNoSideScroll, openDemo, storedRecord, watchForErrors } from "./helpers";

test("the product page makes its argument and asks for one thing", async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("really earns");
  // DESIGN.md §13: the status is a word with a dot, and the story is a
  // numbered list of chapters the reader can land on.
  await expect(page.getByText("Free · open source").first()).toBeVisible();
  for (const id of ["problem", "see", "how", "privacy"]) {
    await expect(page.locator(`li#${id}`)).toBeVisible();
  }
  // One primary action, repeated: hero and close band both open the tool.
  const open = page.getByRole("link", { name: "Open HostStats" });
  await expect(open).toHaveCount(3); // header, hero, close
  await expect(open.first()).toHaveAttribute("href", "/app/");
  // The proof slot is a real screenshot of the product, and it loads.
  const shot = page.locator(".pp-media img");
  await expect(shot).toBeVisible();
  expect(await shot.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  // The legal line carries the copyright and both policy pages.
  await expect(page.locator(".pp-legal").first()).toContainText("Anthony Brignano");
  await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the product page's actions reach the tool", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See it with example data" }).first().click();
  // ?demo=1 loads the bundled export without a click, then tidies the URL.
  await expect(page.getByRole("heading", { name: "What to do now" })).toBeVisible();
  await expect(page).toHaveURL(/\/app\/$/);
});

test("the tool page loads cleanly and takes a calendar link", async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto("/app/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Load your Airbnb exports");
  await expect(page.getByLabel("Airbnb calendar link")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the demo opens on the to-do card with every section", async ({ page }) => {
  const errors = watchForErrors(page);
  await openDemo(page);
  const card = page.locator("section[aria-labelledby=next-actions-heading]");
  await expect(card.getByRole("listitem")).not.toHaveCount(0);
  for (const id of ["profit", "gaps", "pace", "tax"]) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }
  // A card link lands on its section.
  await card
    .getByRole("link", { name: /See gap nights/ })
    .first()
    .click();
  await expect(page).toHaveURL(/#gaps$/);
  expect(errors).toEqual([]);
});

test("the demo fits a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  await expectNoSideScroll(page);
});

test("adding your own file to the demo starts fresh", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "Add more files" }).click();
  await page.setInputFiles("input[type=file]", "e2e/fixtures/own-reservations.csv");
  await expect(page.getByRole("heading", { name: "What to do now" })).toBeVisible();
  await expect(page.getByText("This is example data")).toHaveCount(0);
  // Exactly the file's two stays: with the sample merged in it would read 92.
  await expect(page.getByText("Total Bookings").locator("..")).toHaveText(
    /^\s*Total Bookings\s*2\s*$/i
  );
  await expect(page.getByText("Beach House Retreat")).toHaveCount(0);
  await expect(page.getByLabel("Every month")).toHaveValue("");
});

test("a calendar link shows the upcoming gap nights", async ({ page }) => {
  // Airbnb itself isn't reachable from CI, so the proxy's answer is stubbed
  // with a feed whose dates sit just ahead of today.
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };
  const event = (start: number, end: number, code: string) =>
    [
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${day(start)}`,
      `DTEND;VALUE=DATE:${day(end)}`,
      `UID:${code}@airbnb.com`,
      `DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/${code}`,
      "SUMMARY:Reserved",
      "END:VEVENT",
    ].join("\r\n");
  const feed = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    event(10, 13, "HMCAL00001"),
    event(14, 17, "HMCAL00002"), // one night stuck between the two
    "END:VCALENDAR",
  ].join("\r\n");

  let body: string | null = null;
  await page.route("**/api/calendar", async (route) => {
    body = route.request().postData();
    await route.fulfill({ status: 200, contentType: "text/calendar", body: feed });
  });

  await page.goto("/app/");
  await page
    .getByLabel("Airbnb calendar link")
    .fill("https://www.airbnb.com/calendar/ical/123.ics?s=secret");
  await page.getByRole("button", { name: "Load calendar" }).click();

  await expect(page.getByText(/upcoming gap night/)).toBeVisible();
  // The secret link travels in the request body, never in the page URL.
  expect(body).toContain("s=secret");
  expect(page.url()).not.toContain("secret");
});

test("a link that isn't an Airbnb calendar is refused before any request", async ({ page }) => {
  let called = false;
  await page.route("**/api/calendar", (route) => {
    called = true;
    return route.abort();
  });
  await page.goto("/app/");
  await page.getByLabel("Airbnb calendar link").fill("https://example.com/cal.ics");
  await page.getByRole("button", { name: "Load calendar" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Airbnb calendar link");
  expect(called).toBe(false);
});

test("every page links a favicon the browser can load", async ({ page, request }) => {
  for (const path of ["/", "/app/", "/privacy/", "/terms/"]) {
    await page.goto(path);
    const hrefs = await page
      .locator('link[rel="icon"]')
      .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect((await request.get(href)).ok()).toBe(true);
  }
});

test("an import is kept on this device only when asked, without guest names", async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto("/app/");
  await page.setInputFiles("input[type=file]", "e2e/fixtures/own-with-guests.csv");
  await expect(page.getByRole("heading", { name: "What to do now" })).toBeVisible();

  // Nothing is written until the host says so.
  expect(await storedRecord(page)).toBeNull();

  await page.getByRole("button", { name: "Keep it on this device" }).click();

  // It survives a full reload, and says where it came from.
  await page.reload();
  await expect(page.getByText("Picked up where you left off")).toBeVisible();
  await expect(page.getByText("Total Bookings").locator("..")).toHaveText(
    /^\s*Total Bookings\s*2\s*$/i
  );

  // The most personal column in the file never reached the disk.
  const record = await storedRecord(page);
  expect(JSON.stringify(record)).not.toContain("Scully");
  expect(JSON.stringify(record)).not.toContain("Mulder");
  // ...while the rest of the stay did.
  expect(JSON.stringify(record)).toContain("HMGUEST0001");

  // Unticking deletes it, and the next visit starts on the uploader.
  await page.getByLabel(/Remember my data on this device/).uncheck();
  await expect.poll(() => storedRecord(page)).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Load your Airbnb exports" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the example data is never kept on this device", async ({ page }) => {
  await openDemo(page);
  // The demo shows no offer to keep it, and writes nothing either way.
  await expect(page.getByRole("button", { name: "Keep it on this device" })).toHaveCount(0);
  expect(await storedRecord(page)).toBeNull();
});
