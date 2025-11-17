import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface GlobalFilterState {
  team: string | null;
  service: string | null;
  environment: string | null;
  cluster: string | null;
  timeRange: string; // "1h" | "24h" | "7d" | "30d"
}

// Load saved state
const saved = localStorage.getItem("globalFilters");
const initialState: GlobalFilterState = saved
  ? JSON.parse(saved)
  : {
      team: null,
      service: null,
      environment: null,
      cluster: null,
      timeRange: "24h",
    };

const globalFilterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setTeam: (state, action: PayloadAction<string | null>) => {
      state.team = action.payload;
    },
    setService: (state, action: PayloadAction<string | null>) => {
      state.service = action.payload;
    },
    setEnvironment: (state, action: PayloadAction<string | null>) => {
      state.environment = action.payload;
    },
    setCluster: (state, action: PayloadAction<string | null>) => {
      state.cluster = action.payload;
    },
    setTimeRange: (state, action: PayloadAction<string>) => {
      state.timeRange = action.payload;
    },
    resetFilters: (state) => {
      state.team = null;
      state.service = null;
      state.environment = null;
      state.cluster = null;
      state.timeRange = "24h";
    },
  },
});

// Export actions
export const {
  setTeam,
  setService,
  setEnvironment,
  setCluster,
  setTimeRange,
  resetFilters,
} = globalFilterSlice.actions;

export default globalFilterSlice.reducer;
