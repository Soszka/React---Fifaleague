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
    const resultFilter = page.getByRole("button", { name: "Wynik" });
    await expect(resultFilter).toHaveCount(0);

    await page.getByRole("button", { name: "Moje mecze" }).click();
    await expect(resultFilter).toBeVisible();
  });

  test("filters matches by date range and restores results", async ({ page }) => {
    const fromInput = page.getByRole("textbox", { name: "Od" });
    await fromInput.fill("01.01.2100");
    await fromInput.press("Enter");

    await expect(page.getByText("Brak meczów")).toBeVisible();

    await page.getByRole("button", { name: "Wyczyść" }).click();

    await expect(page.getByText("Brak meczów")).not.toBeVisible();
    await expect(page.getByRole("row", { name: /Przeciwnik/i })).toBeVisible();
  });
});
