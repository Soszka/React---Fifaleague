import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Change log", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Aktualności" }).click();
    await page.waitForURL("**/app/news");
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("lists latest activities with author context", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Aktualności/ })).toBeVisible();

    const entry = page
      .locator("article, [role='article'], .MuiCard-root")
      .filter({ hasText: /dodał mecz|zaktualizował mecz|usunął mecz/i })
      .first();

    await expect(entry).toBeVisible();
    await expect(entry.getByText(/Wydarzenie:/)).toBeVisible();
    await expect(entry.getByText(/Data meczu/)).toBeVisible();
  });
});
