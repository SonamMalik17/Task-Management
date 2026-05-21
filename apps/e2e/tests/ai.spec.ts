import { expect, test, createBoard } from './fixtures';

// AI tests assume the MOCK provider is wired (no ANTHROPIC_API_KEY in e2e env),
// so outputs are deterministic. The mock detects "urgent/critical/blocker"
// → priority urgent; "important/soon" → high; otherwise medium.

test.describe('AI features', () => {
  test('natural-language task input: parse then confirm', async ({ authedPage }) => {
    await createBoard(authedPage, 'AI Board');

    // The NL input lives next to a Parse button.
    await authedPage.getByPlaceholder(/urgent: ship release notes/i).fill(
      'Urgent: ship release notes',
    );
    await authedPage.getByRole('button', { name: /^parse$/i }).click();

    // Draft appears, with the inferred urgent priority and a confidence chip.
    await expect(authedPage.getByText(/suggested task/i)).toBeVisible();
    await expect(authedPage.getByText(/Urgent: ship release notes/)).toBeVisible();
    await expect(authedPage.getByText(/priority: urgent/i)).toBeVisible();
    await expect(authedPage.getByText(/% confidence/i)).toBeVisible();

    // Commit → task appears on the Kanban.
    await authedPage.getByRole('button', { name: /create task/i }).click();
    await expect(authedPage.getByText('Urgent: ship release notes')).toBeVisible();
  });

  test('NL input cancel discards the draft', async ({ authedPage }) => {
    await createBoard(authedPage, 'AI Cancel Board');
    await authedPage.getByPlaceholder(/urgent: ship release notes/i).fill('Some task later');
    await authedPage.getByRole('button', { name: /^parse$/i }).click();
    await expect(authedPage.getByText(/suggested task/i)).toBeVisible();
    await authedPage.getByRole('button', { name: /^cancel$/i }).click();
    await expect(authedPage.getByText(/suggested task/i)).toBeHidden();
  });

  test('AI assist suggests tasks and one-click adds them', async ({ authedPage }) => {
    await createBoard(authedPage, 'Suggest Board');

    await authedPage.getByLabel(/what are you trying to accomplish/i).fill('launch checklist');
    await authedPage.getByRole('button', { name: /suggest tasks/i }).click();

    // Mock returns up to 5 suggestions from a seed list. Just assert ≥ 1 appears.
    const addButtons = authedPage.getByRole('button', { name: /add to board/i });
    await expect(addButtons.first()).toBeVisible();
    const firstSuggestionTitle = await addButtons
      .first()
      .locator('xpath=ancestor::div[1]/p[1]')
      .innerText();

    await addButtons.first().click();
    // The suggestion is removed AND a Kanban card with the same title appears.
    await expect(authedPage.getByText(firstSuggestionTitle).first()).toBeVisible();
  });

  test('AI summarize on an existing task', async ({ authedPage }) => {
    // Seed a board + task via API.
    await createBoard(authedPage, 'Summarize Board');
    const token = await authedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('ai-task-auth') ?? '{}').accessToken,
    );
    const apiUrl = process.env.API_URL ?? 'http://localhost:4101';
    const boardId = new URL(authedPage.url()).pathname.split('/').pop();
    await authedPage.request.post(`${apiUrl}/api/tasks`, {
      headers: { authorization: `Bearer ${token}` },
      data: {
        boardId,
        title: 'Investigate flaky test',
        description: 'CI fails 1 in 20 runs on the search endpoint suite.',
      },
    });

    await authedPage.reload();
    await authedPage.getByText('Investigate flaky test').click();
    await authedPage.getByRole('button', { name: /ai summarize/i }).click();
    // Mock provider returns a summary that quotes the title.
    await expect(authedPage.getByText(/^Summary$/i)).toBeVisible();
    await expect(authedPage.getByText(/Investigate flaky test/).nth(1)).toBeVisible();
  });
});
