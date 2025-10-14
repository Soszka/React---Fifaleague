import { expect, Page } from "@playwright/test";

export interface Credentials {
  email: string;
  password: string;
}

export const defaultCredentials: Credentials = {
  email: process.env.E2E_EMAIL ?? "adam@adam.com",
  password: process.env.E2E_PASSWORD ?? "Adam123",
};

export const login = async (page: Page, creds: Credentials = defaultCredentials) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Zalogowania/i })).toBeVisible();

  await page.getByLabel(/Email/i).fill(creds.email);
  const passwordInput = page.locator('input[name="password"], input[type="password"]');
  await expect(passwordInput).toHaveCount(1);
  await passwordInput.fill(creds.password);

  await page.getByRole("button", { name: /Zaloguj/i }).click();

  await page.waitForURL("**/app/home", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Witaj/i })).toBeVisible();
};

export const logoutIfPossible = async (page: Page) => {
  const accountButton = page.getByRole("button", { name: /Konto/i });
  try {
    if (await accountButton.isVisible()) {
      await accountButton.click();
      const logoutButton = page.getByRole("menuitem", { name: /Wyloguj się/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL("**/auth", { waitUntil: "domcontentloaded" });
      }
    }
  } catch (error) {
    if (process.env.CI) {
      console.warn("Nie udało się automatycznie wylogować użytkownika:", error);
    }
  }
};
