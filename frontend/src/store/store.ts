import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/user.slice';
import { createGenerationSlice, GenerationSlice } from './slices/generation.slice';
import { createUiSlice, UiSlice } from './slices/ui.slice';

type StoreState = UserSlice & GenerationSlice & UiSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createGenerationSlice(...a),
  ...createUiSlice(...a),
}));
