import { configureStore } from "@reduxjs/toolkit";
import globalFilterReducer from "./slices/globalFilterSlice";
import preferenceReducer from "./slices/preferenceSlice";
import systemReducer from "./slices/systemSlice";

export const store = configureStore({
  reducer: {
    filters: globalFilterReducer,
    preferences: preferenceReducer,
    system: systemReducer,
  },
});

// Infer root state & dispatch type
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
