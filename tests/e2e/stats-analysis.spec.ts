import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Stats analysis", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Statystyki" }).click();
    await page.waitForURL("**/app/stats");
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("provides detailed metrics for the selected player", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Statystyki", exact: true })
    ).toBeVisible();

    await expect(page.getByText("Łącznie meczów")).toBeVisible();
    await expect(page.getByText("Łącznie punktów")).toBeVisible();

    await expect(page.getByRole("tab", { name: "Mecze" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Zwycięstwa" })).toBeVisible();
  });
});
