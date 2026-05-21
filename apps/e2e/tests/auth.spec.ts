import { expect, test } from './fixtures';

test.describe('Auth', () => {
  test('register → land on dashboard', async ({ authedPage, user }) => {
    await expect(authedPage).toHaveURL(/\/dashboard$/);
    await expect(authedPage.getByText(user.name)).toBeVisible();
  });

  test('sign out clears session and redirects to /login', async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /sign out/i }).click();
    await authedPage.waitForURL(/\/login$/);
    // Going back to /dashboard should bounce to /login.
    await authedPage.goto('/dashboard');
    await authedPage.waitForURL(/\/login$/);
  });

  test('login with the just-registered credentials works', async ({ page, user }) => {
    // First register via the API directly so we don't depend on the register form
    // already being covered; the goal here is the LOGIN path.
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    const reg = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(user),
    });
    expect(reg.ok).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard$/);
  });

  test('login with wrong password shows error and stays on /login', async ({ page, user }) => {
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(user),
    });
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('totally-wrong-1');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Toast appears, URL doesn't change.
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('protected routes redirect when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login$/);
  });
});
