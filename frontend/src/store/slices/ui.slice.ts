import { StateCreator } from 'zustand';

export interface UiSlice {
  showAgeConfirmModal: boolean;
  setShowAgeConfirmModal: (show: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  showAgeConfirmModal: false,
  setShowAgeConfirmModal: (show) => set({ showAgeConfirmModal: show }),
});
