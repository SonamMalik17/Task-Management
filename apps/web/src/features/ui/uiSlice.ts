import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// UI-only state: modals, selected task, AI panel visibility. Server state
// (boards, tasks) lives in RTK Query — keep this slice small.
export interface UIState {
  selectedTaskId: string | null;
  aiPanelOpen: boolean;
  toast: { message: string; tone: 'info' | 'error' | 'success' } | null;
}

const initialState: UIState = {
  selectedTaskId: null,
  aiPanelOpen: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    toggleAIPanel: (state, action: PayloadAction<boolean | undefined>) => {
      state.aiPanelOpen = action.payload ?? !state.aiPanelOpen;
    },
    showToast: (state, action: PayloadAction<UIState['toast']>) => {
      state.toast = action.payload;
    },
  },
});

export const { selectTask, toggleAIPanel, showToast } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
