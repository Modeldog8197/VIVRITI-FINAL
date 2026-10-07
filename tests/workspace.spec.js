import { test, expect } from "@playwright/test";
for (const width of [1440, 390])
  test(`all pages work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of [
      "index.html",
      "bb.html",
      "fb.html",
      "cricket.html",
      "training.html",
      "progress.html",
      "mypage.html",
      "shop.html",
    ]) {
      await page.goto("/" + route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".site-footer")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
      expect(await page.locator("iframe").count()).toBe(0);
    }
    expect(errors).toEqual([]);
  });
test("drill filters, favourites and local guide work", async ({ page }) => {
  await page.goto("/bb.html");
  await expect(page.locator(".drill-card")).toHaveCount(12);
  await page.locator("#search").fill("crossover");
  await expect(page.locator(".drill-card")).toHaveCount(1);
  await page.locator("[data-favourite]").click();
  await page.reload();
  await page.locator("#saved-only").check();
  await expect(page.locator(".drill-card")).toHaveCount(1);
  await page.locator("#guide-question").fill("passing");
  await page.locator("#guide-form button").click();
  await expect(page.locator("#guide-results a").first()).toBeVisible();
  await page.locator("#guide-results a").first().click();
  await expect(page.locator(".drill-card")).toHaveCount(1);
});
test("planner timer and journal record actual user input", async ({ page }) => {
  await page.goto("/training.html#planner");
  await page.locator("#plan-form button").click();
  await expect(page.locator("#plan-total")).toHaveText("30 minutes");
  await expect(page.locator("#timer-time")).toHaveText("05:00");
  await page.locator("#timer-start").click();
  await expect(page.locator("#timer-start")).toHaveText("Pause");
  await page.waitForTimeout(1150);
  await expect(page.locator("#timer-time")).not.toHaveText("05:00");
  await page.locator("#timer-start").click();
  await expect(page.locator("#timer-start")).toHaveText("Start");
  await page.locator("#timer-next").click();
  await expect(page.locator("#timer-block")).toContainText("2 /");
  await page.locator("#timer-reset").click();
  await page.locator("#log-minutes").fill("24");
  await page.locator("#log-effort").fill("5");
  await page.locator("#log-notes").fill("<script>alert(1)</script>");
  await page.locator("#log-form button").click();
  await expect(page.locator("#log-message")).toContainText("Saved");
  await page.goto("/progress.html");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("24 / 30 min");
  await expect(page.locator("tbody")).toContainText(
    "<script>alert(1)</script>",
  );
  await page.locator(".chart button").last().click();
  await expect(page.locator("#day-details")).toContainText("120 effort");
  const download = page.waitForEvent("download");
  await page.locator("#export-logs").click();
  expect((await download).suggestedFilename()).toBe(
    "vivriti-training-backup.json",
  );
  await page.locator("[data-delete]").click();
  await expect(page.locator(".empty")).toBeVisible();
  await page.locator("#import-status button").click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("bad backup import preserves journal; valid import merges idempotently", async ({
  page,
}) => {
  await page.goto("/progress.html");
  const good = {
    version: 1,
    logs: [
      {
        id: "one",
        sport: "football",
        date: "2026-10-05",
        minutes: 20,
        effort: 4,
        notes: "Test note",
        plannedMinutes: 30,
      },
    ],
  };
  await page.locator("#import-logs").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(good)),
  });
  await expect(page.locator("#import-status")).toContainText("Imported 1");
  await page.locator("#import-logs").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        logs: [...good.logs, { ...good.logs[0], id: "bad", minutes: -1 }],
      }),
    ),
  });
  await expect(page.locator("#import-status")).toContainText("rejected");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.locator("#clear-logs").click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.locator("#cancel-clear").click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("nutrition exclusions and age-aware BMI reference work", async ({
  page,
}) => {
  await page.goto("/mypage.html");
  await page.locator("#diet").selectOption("vegan");
  await page.locator("[value=gluten]").check();
  await page.locator("#meal-form button").click();
  await expect(page.locator(".meal-card")).toHaveCount(4);
  expect(await page.locator("#meals").textContent()).not.toMatch(
    /curd|Paneer|Chicken|Eggs|roti/i,
  );
  await page.locator("details summary").click();
  await page.locator("#age").fill("17");
  await page.locator("#weight").fill("70");
  await page.locator("#height").fill("175");
  await page.locator("#bmi-form button").click();
  await expect(page.locator("#bmi-result")).toContainText("ages 2–19");
  await page.locator("#age").fill("25");
  await page.locator("#bmi-form button").click();
  await expect(page.locator("#bmi-result")).toContainText("22.9");
});
test("equipment checklist persists and exports", async ({ page }) => {
  await page.goto("/shop.html");
  await page.locator("#gear-filter").selectOption("cricket");
  await expect(page.locator("#gear-list .equipment-card")).toHaveCount(2);
  await page.locator("details summary").click();
  await expect(page.locator("#catalogue-list a")).toHaveCount(24);
  await page.locator("[data-kit=cricket]").click();
  await expect(page.locator("#kit-list input")).toHaveCount(3);
  await page.locator("#kit-list input").first().check();
  await page.reload();
  await expect(page.locator("#kit-list input")).toHaveCount(3);
  await expect(page.locator("#kit-list input").first()).toBeChecked();
  const d = page.waitForEvent("download");
  await page.locator("#export-kit").click();
  expect((await d).suggestedFilename()).toBe("vivriti-kit-checklist.txt");
});
test("original assistants are opt-in and retain sport-specific URLs", async ({
  page,
}) => {
  await page.route("https://app.gpt-trainer.com/**", (route) =>
    route.fulfill({
      body: "<p>Provider test stub</p>",
      contentType: "text/html",
    }),
  );
  await page.goto("/cricket.html#coach");
  await expect(page.locator("#open-coach")).toHaveAttribute("href", /4d44d307/);
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.locator("#load-coach").click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /4d44d307/);
  await page.locator("#coach-sport").selectOption("basketball");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("#open-coach")).toHaveAttribute("href", /40385727/);
});
