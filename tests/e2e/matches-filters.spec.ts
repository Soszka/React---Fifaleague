import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Matches filters", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Mecze" }).click();
    await page.waitForURL("**/app/matches");
    await expect(page.getByRole("heading", { name: /Meczów/i })).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("switches between personal and all matches views", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Wszystkie mecze" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const resultFilter = page.getByTestId("matches-result-filter");
    await expect(resultFilter).toHaveCount(0);

    await page.getByRole("button", { name: "Moje mecze" }).click();
    await expect(resultFilter).toBeVisible();
  });
});
