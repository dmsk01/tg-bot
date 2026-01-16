import type { UiSlice } from './slices/ui.slice';
import type { UserSlice } from './slices/user.slice';
import type { GenerationSlice } from './slices/generation.slice';

import { create } from 'zustand';

import { createUiSlice } from './slices/ui.slice';
import { createUserSlice } from './slices/user.slice';
import { createGenerationSlice } from './slices/generation.slice';

type StoreState = UserSlice & GenerationSlice & UiSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createGenerationSlice(...a),
  ...createUiSlice(...a),
}));
