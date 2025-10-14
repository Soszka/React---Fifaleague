import { test, expect } from "@playwright/test";
import { login, logoutIfPossible } from "./utils/auth";

test.describe("Team standings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Tabela" }).click();
    await page.waitForURL("**/app/table");
  });

  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("exposes the league table with filtering controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Tabelę/i })).toBeVisible();

    const columnHeaders = [
      "Lp.",
      "Drużyna",
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

    const filterLabels = ["Gracz", "Mecze", "Punkty", "Pkt/Mecz"];
    for (const label of filterLabels) {
      await expect(page.getByLabel(label)).toBeVisible();
    }

    await expect(page.getByRole("button", { name: /Wyczyść/i })).toBeVisible();

    const filterButton = page.getByRole("button", { name: /Filtruj/i });
    if (await filterButton.count()) {
      await filterButton.click();

      const dialog = page.getByRole("dialog", { name: /Filtry/i });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("Gracz")).toBeVisible();
      await expect(dialog.getByLabel("Mecze")).toBeVisible();
      await expect(dialog.getByLabel("Punkty")).toBeVisible();
      await expect(dialog.getByLabel("Pkt/Mecz")).toBeVisible();

      await dialog.getByRole("button", { name: /Zamknij/i }).click();
      await expect(dialog).not.toBeVisible();
    }
  });
});
