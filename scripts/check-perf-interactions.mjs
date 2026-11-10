/** Same local user actions before and after a performance pass; timings are
 * automation-observed action-to-next-frame, not field INP. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [baseURL = "http://127.0.0.1:4173", outDir = "output/performance/interactions"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const rows = [];
try {
  for (const [device, viewport] of [["mobile", { width: 412, height: 823 }], ["desktop", { width: 1350, height: 940 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const load = async (route) => {
      const response = await page.goto(new URL(route, baseURL).href, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200);
    };
    const action = async (name, perform, ready) => {
      const started = performance.now();
      await perform();
      await ready();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      rows.push({ device, action: name, ms: Math.round(performance.now() - started) });
    };

    await load("/");
    const input = page.locator("main input[role=combobox]");
    await action("slash focuses page search", () => page.keyboard.press("/"), () => page.waitForFunction(() => document.activeElement?.matches("main input[role=combobox]")));
    await action("Rooney search results", () => input.fill("Rooney"), () => page.getByRole("option").filter({ hasText: "Wayne Rooney" }).first().waitFor());
    await action("search selection opens Rooney", () => page.getByRole("option").filter({ hasText: "Wayne Rooney" }).first().click(), () => page.locator("main h1").filter({ hasText: /Wayne Rooney/i }).waitFor());

    await load("/matches");
    await page.getByRole("button", { name: device === "mobile" ? "Filters" : "Filter", exact: true }).click();
    await page.getByRole("button", { name: /Any competition/ }).click();
    await page.getByRole("option").filter({ hasText: "Premier League" }).waitFor();
    // Exclude the already-open sheet's entrance animation from filter timing.
    await page.waitForTimeout(450);
    await action("Premier League filter", () => page.getByRole("option").filter({ hasText: "Premier League" }).click(), () => page.waitForURL((url) => url.searchParams.has("competition")));
    await page.screenshot({ path: `${outDir}/matches-filter-${device}.png` });

    await load("/match/1999-05-26-bayern-munich-n");
    const matchPlay = page.getByRole("button", { name: "Play the match", exact: true });
    await matchPlay.scrollIntoViewIfNeeded();
    await action("match replay", () => matchPlay.click(), () => page.locator(".mf.mf-play").waitFor());

    await load("/seasons/1998-99");
    const seasonPlay = page.getByRole("button", { name: /Play the 1998-99 league season/ });
    await seasonPlay.scrollIntoViewIfNeeded();
    await action("season replay", () => seasonPlay.click(), () => page.locator(".cd-play").waitFor());
    assert.deepEqual(errors, [], `${device} console errors`);
    await page.close();
  }
} finally {
  await browser.close();
  writeFileSync(`${outDir}/actions.json`, JSON.stringify(rows, null, 2) + "\n");
}
console.table(rows);
