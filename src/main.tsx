import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppWithLoading } from "./app/router";
import { AppProviders } from "./app/providers";
import { store } from "./store/store";

// persist redux → localStorage
store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("globalFilters", JSON.stringify(state.filters));
  localStorage.setItem("preferences", JSON.stringify(state.preferences));
  localStorage.setItem("systemSlice", JSON.stringify(state.system));
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders store={store}>
      <AppWithLoading />
    </AppProviders>
  </React.StrictMode>
);
