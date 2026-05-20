import { selectTask, showToast, toggleAIPanel, uiReducer } from '../uiSlice';

describe('uiSlice', () => {
  const initial = uiReducer(undefined, { type: '@@INIT' });

  it('selects a task', () => {
    expect(uiReducer(initial, selectTask('t1')).selectedTaskId).toBe('t1');
  });

  it('toggles AI panel explicitly', () => {
    expect(uiReducer(initial, toggleAIPanel(true)).aiPanelOpen).toBe(true);
    expect(uiReducer({ ...initial, aiPanelOpen: true }, toggleAIPanel()).aiPanelOpen).toBe(false);
  });

  it('shows a toast', () => {
    const state = uiReducer(initial, showToast({ tone: 'success', message: 'ok' }));
    expect(state.toast?.message).toBe('ok');
  });
});
