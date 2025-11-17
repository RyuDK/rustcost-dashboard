import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PreferenceState {
  language: string; // "en", "ko", etc
  theme: "light" | "dark";
}

const saved = localStorage.getItem("preferences");
const initialState: PreferenceState = saved
  ? JSON.parse(saved)
  : {
      language: "en",
      theme: "light",
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
  },
});

export const { setLanguage, setTheme } = preferenceSlice.actions;

export default preferenceSlice.reducer;
