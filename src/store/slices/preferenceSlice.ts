import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PreferenceState {
  language: string; // "en", "ko", etc
  theme: "light" | "dark";
  timezone: string; // e.g. "Asia/Seoul"
  showExplain: boolean;
}
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const saved = localStorage.getItem("preferences");
const defaultPreferences: PreferenceState = {
  language: "en",
  theme: "light",
  timezone: defaultTimezone,
  showExplain: false,
};
const initialState: PreferenceState = saved
  ? { ...defaultPreferences, ...JSON.parse(saved) }
  : defaultPreferences;

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
    setShowExplain: (state, action: PayloadAction<boolean>) => {
      state.showExplain = action.payload;
    },
  },
});

export const { setLanguage, setTheme, setTimezone, setShowExplain } =
  preferenceSlice.actions;

export default preferenceSlice.reducer;
