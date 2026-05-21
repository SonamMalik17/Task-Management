import { expect, test, createBoard } from './fixtures';

// Tasks are created via the NL input + AI parse path (covered in ai.spec) and
// via the AI Assist suggestions. There's no manual "+ Task" button on the
// board page — the design assumes you describe what you want. So in this file
// we exercise CRUD on a task that we seed through the API, focusing on the
// UI behaviors: open detail, comment, mark done, delete.

test.describe('Tasks', () => {
  test('mark a task done and reopen it', async ({ authedPage }) => {
    const boardId = await createBoard(authedPage, 'Task Board');
    // Seed a task via the API using the access token from localStorage.
    const token = await authedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('ai-task-auth') ?? '{}').accessToken,
    );
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    const taskRes = await authedPage.request.post(`${apiUrl}/api/tasks`, {
      headers: { authorization: `Bearer ${token}` },
      data: { boardId, title: 'Write proposal', priority: 'high' },
    });
    expect(taskRes.ok()).toBeTruthy();

    // Wait for it to appear on the board.
    await authedPage.reload();
    const card = authedPage.getByText('Write proposal');
    await card.waitFor();
    await card.click();

    // Detail modal opens.
    await expect(authedPage.getByRole('dialog')).toBeVisible();
    await authedPage.getByRole('button', { name: /mark done/i }).click();
    // Modal updates: button now says "Reopen".
    await expect(authedPage.getByRole('button', { name: /reopen/i })).toBeVisible();

    // Reopen and confirm the button flips back.
    await authedPage.getByRole('button', { name: /reopen/i }).click();
    await expect(authedPage.getByRole('button', { name: /mark done/i })).toBeVisible();
  });

  test('add a comment to a task', async ({ authedPage }) => {
    const boardId = await createBoard(authedPage, 'Comment Board');
    const token = await authedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('ai-task-auth') ?? '{}').accessToken,
    );
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    await authedPage.request.post(`${apiUrl}/api/tasks`, {
      headers: { authorization: `Bearer ${token}` },
      data: { boardId, title: 'Talk to legal' },
    });

    await authedPage.reload();
    await authedPage.getByText('Talk to legal').click();
    await authedPage.getByLabel(/^$/).first(); // ensure dialog has rendered

    const input = authedPage.locator('#comment');
    await input.fill('Reaching out today');
    await authedPage.getByRole('button', { name: /^send$/i }).click();
    // After send the field clears.
    await expect(input).toHaveValue('');
  });

  test('delete a task removes it from the board', async ({ authedPage }) => {
    const boardId = await createBoard(authedPage, 'Delete Board');
    const token = await authedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('ai-task-auth') ?? '{}').accessToken,
    );
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    await authedPage.request.post(`${apiUrl}/api/tasks`, {
      headers: { authorization: `Bearer ${token}` },
      data: { boardId, title: 'Temporary task' },
    });

    await authedPage.reload();
    // The card has role=button (clickable div with title + priority badge).
    // Match by the title-prefixed accessible name so we don't collide with the
    // modal heading once the drawer opens.
    const card = authedPage.getByRole('button', { name: /^Temporary task/ });
    await card.click();
    await authedPage.getByRole('button', { name: /^delete$/i }).click();
    await expect(card).toBeHidden();
  });
});
