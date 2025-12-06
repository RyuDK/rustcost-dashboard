import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PreferenceState {
  language: string; // "en", "ko", etc
  theme: "light" | "dark";
  timezone: string; // e.g. "Asia/Seoul"
}
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const saved = localStorage.getItem("preferences");
const initialState: PreferenceState = saved
  ? JSON.parse(saved)
  : {
      language: "en",
      theme: "light",
      timezone: defaultTimezone,
    };

const preferenceSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
  },
});

export const { setLanguage, setTheme, setTimezone } = preferenceSlice.actions;

export default preferenceSlice.reducer;
