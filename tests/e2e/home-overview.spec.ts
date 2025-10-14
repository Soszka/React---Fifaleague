import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Home overview", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("shows highlight statistics and quick navigation cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Witaj/i })).toBeVisible();

    const highlightLabels = [
      "Wynik ostatniego meczu",
      "Mecze w tym tygodniu",
      "Procent wygranych spotkań",
      "Średnia zdobytych goli na mecz",
    ];

    for (const label of highlightLabels) {
      await expect(page.getByLabel(label).first()).toBeVisible();
    }

    const quickLinks = [
      "MECZE",
      "STATYSTYKI",
      "TABELA",
      "ZESPOŁY",
    ];

    for (const name of quickLinks) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }

    await expect(page.getByText(/OSTATNIE MECZE/i)).toBeVisible();
  });
});
