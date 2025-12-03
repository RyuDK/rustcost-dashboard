// systemSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SystemState {
  last_resync_time_utc: string | null;
}

const persisted = localStorage.getItem("systemSlice");

const initialState: SystemState = persisted
  ? JSON.parse(persisted)
  : {
      last_resync_time_utc: null,
    };

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
  },
});

export const { setLastResyncTimeUtc, clearLastResync } = systemSlice.actions;
export default systemSlice.reducer;
