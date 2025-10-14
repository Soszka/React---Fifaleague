import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Player rankings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Ranking" }).click();
    await page.waitForURL("**/app/ranking");
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("shows leaderboard metrics and filter actions", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Ranking/ })).toBeVisible();

    const columnHeaders = [
      "Lp.",
      "Gracz",
      "Mecze",
      "Wygrane",
      "Porażki",
      "Remisy",
      "Pkt",
      "Pkt/Mecz",
    ];

    for (const header of columnHeaders) {
      await expect(
        page.getByRole("columnheader", { name: header, exact: true })
      ).toBeVisible();
    }

    await expect(page.getByLabel("Gracz")).toBeVisible();
    await expect(page.getByLabel("Mecze")).toBeVisible();
    await expect(page.getByLabel("Punkty")).toBeVisible();
    await expect(page.getByLabel("Pkt/Mecz")).toBeVisible();

    await expect(page.getByRole("button", { name: /Wyczyść/i })).toBeVisible();
  });
});
