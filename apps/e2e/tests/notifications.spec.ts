import { expect, test, createBoard } from './fixtures';

test.describe('Notifications', () => {
  test('inviting a member sends them a notification', async ({ authedPage, browser }) => {
    // 1. As userA: create a board.
    const boardName = `Invite Board ${Date.now().toString(36)}`;
    await createBoard(authedPage, boardName);

    // 2. Open a SECOND browser context and register userB through the UI.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const userB = {
      name: `Bob ${Date.now().toString(36)}`,
      email: `bob-${Date.now().toString(36)}@example.com`,
      password: 'goodpass1',
    };
    await pageB.goto('/register');
    await pageB.getByLabel('Name').fill(userB.name);
    await pageB.getByLabel('Email').fill(userB.email);
    await pageB.getByLabel('Password').fill(userB.password);
    await pageB.getByRole('button', { name: /create account/i }).click();
    await pageB.waitForURL(/\/dashboard$/);

    // 3. Back to userA — invite bob.
    await authedPage.getByPlaceholder('teammate@example.com').fill(userB.email);
    await authedPage.getByRole('button', { name: /^invite$/i }).click();
    await expect(authedPage.getByText(/member added/i)).toBeVisible();

    // 4. Bob refreshes and his notification bell shows a 1.
    await pageB.reload();
    await pageB.getByRole('button', { name: /notifications/i }).click();
    await expect(pageB.getByText(/board invite|added to a board/i).first()).toBeVisible();

    await ctxB.close();
  });

  test('mark all read clears the unread count', async ({ authedPage, browser }) => {
    // Owner sets up board and invites Bob, mirroring the previous test.
    const boardName = `Read Board ${Date.now().toString(36)}`;
    await createBoard(authedPage, boardName);

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const bobEmail = `bob-read-${Date.now().toString(36)}@example.com`;
    await pageB.goto('/register');
    await pageB.getByLabel('Name').fill('Bob Read');
    await pageB.getByLabel('Email').fill(bobEmail);
    await pageB.getByLabel('Password').fill('goodpass1');
    await pageB.getByRole('button', { name: /create account/i }).click();
    await pageB.waitForURL(/\/dashboard$/);

    await authedPage.getByPlaceholder('teammate@example.com').fill(bobEmail);
    await authedPage.getByRole('button', { name: /^invite$/i }).click();
    await expect(authedPage.getByText(/member added/i)).toBeVisible();

    await pageB.reload();
    await pageB.getByRole('button', { name: /notifications/i }).click();
    await pageB.getByRole('button', { name: /mark all read/i }).click();
    // Unread badge gone.
    await expect(pageB.locator('button[aria-label="Notifications"] span').first()).toBeHidden();

    await ctxB.close();
  });
});
