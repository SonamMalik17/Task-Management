import { expect, test, createBoard } from './fixtures';

test.describe('Boards', () => {
  test('empty state on first sign-in', async ({ authedPage }) => {
    await expect(authedPage.getByText(/don.?t have any boards yet/i)).toBeVisible();
  });

  test('create a board and navigate into it', async ({ authedPage }) => {
    const id = await createBoard(authedPage, 'Demo Board');
    expect(id).toMatch(/^[a-f0-9]{24}$/);
    await expect(authedPage.getByRole('heading', { name: 'Demo Board' })).toBeVisible();
    // Header shows the task count.
    await expect(authedPage.getByText('0 tasks')).toBeVisible();
  });

  test('board appears on dashboard after creation', async ({ authedPage }) => {
    await createBoard(authedPage, 'Listed Board');
    await authedPage.goto('/dashboard');
    await expect(authedPage.getByRole('link', { name: /Listed Board/ })).toBeVisible();
  });
});
