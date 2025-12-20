// systemSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SystemState {
  last_resync_time_utc: string | null;
  isFirstTime: boolean;
}

const persisted = localStorage.getItem("systemSlice");

const defaultState: SystemState = {
  last_resync_time_utc: null,
  isFirstTime: true,
};

const initialState: SystemState = persisted
  ? { ...defaultState, ...JSON.parse(persisted) }
  : defaultState;

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    setLastResyncTimeUtc: (state, action: PayloadAction<string>) => {
      state.last_resync_time_utc = action.payload;
    },
    clearLastResync: (state) => {
      state.last_resync_time_utc = null;
    },
    completeOnboarding: (state) => {
      state.isFirstTime = false;
    },
  },
});

export const { setLastResyncTimeUtc, clearLastResync, completeOnboarding } =
  systemSlice.actions;
export default systemSlice.reducer;
