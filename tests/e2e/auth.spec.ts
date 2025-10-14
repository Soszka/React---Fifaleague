import { test, expect } from "@playwright/test";
import { defaultCredentials, login, logoutIfPossible } from "./utils/auth";

test.describe("Authentication", () => {
  test.afterEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("requires valid credentials to sign in", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Zaloguj/i }).click();

    await expect(page.getByText(/Wpisz adres e-mail/i)).toBeVisible();
    await expect(page.getByText(/Wpisz hasło/i)).toBeVisible();

    await page.getByLabel(/Email/i).fill("niepoprawny");
    await page.getByRole("button", { name: /Zaloguj/i }).click();
    await expect(page.getByText(/Niepoprawny adres e-mail/i)).toBeVisible();
  });

  test("signs in a player with valid credentials", async ({ page }) => {
    await login(page, defaultCredentials);
    await expect(page).toHaveURL(/\/app\/home/);
    await expect(page.getByRole("heading", { name: /Witaj/i })).toContainText(
      /Witaj\s+Adam/i
    );
  });
});
