import { test as base, expect, type Page } from '@playwright/test';

// Each test gets a freshly-registered user. We don't truncate the DB between
// tests (the orchestrator owns the DB lifecycle); instead, uniqueness comes
// from a per-test email. This makes the suite safe to run in any order.

type AuthedFixtures = {
  authedPage: Page;
  user: { email: string; password: string; name: string };
};

let userCounter = 0;
function nextUser() {
  userCounter += 1;
  const stamp = `${Date.now().toString(36)}-${userCounter}`;
  return {
    email: `e2e-${stamp}@example.com`,
    password: 'goodpass1',
    name: `E2E User ${stamp}`,
  };
}

export const test = base.extend<AuthedFixtures>({
  user: async ({}, use) => {
    await use(nextUser());
  },
  authedPage: async ({ page, user }, use) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/\/dashboard$/);
    await use(page);
  },
});

export { expect };

// Helpers for use inside tests.
export async function createBoard(page: Page, name: string): Promise<string> {
  await page.getByRole('button', { name: /new board/i }).click();
  await page.getByLabel('Board name').fill(name);
  await page.getByRole('button', { name: /^create$/i }).click();
  // Wait for the board card to appear on the dashboard.
  await page.getByRole('link', { name: new RegExp(name) }).waitFor();
  // Open it and capture the id from the URL.
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await page.waitForURL(/\/board\/[a-f0-9]{24}/);
  const url = new URL(page.url());
  const id = url.pathname.split('/').pop()!;
  // Wait for board to render.
  await page.getByRole('heading', { name }).waitFor();
  return id;
}
