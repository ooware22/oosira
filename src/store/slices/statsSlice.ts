import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '@/api/apiClient';

interface QuickStats {
  totalCvs: number;
  completedCvs: number;
  draftCvs: number;
  totalDownloads: number;
  totalViews: number;
  sharedLinks: number;
  profileScore: number;
}

interface ActivityData {
  day: string;
  value: number;
}

interface TemplateData {
  name: string;
  pct: number;
  color: string;
}

interface RecentActivity {
  action: string;
  cv: string;
  time: string;
  type: string;
}

interface StatsData {
  quickStats: QuickStats;
  weeklyActivity: ActivityData[];
  templateUsage: TemplateData[];
  recentActivity: RecentActivity[];
}

interface StatsState {
  data: StatsData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: StatsState = {
  data: null,
  status: 'idle',
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'stats/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiFetch('/stats/dashboard/');
      return data as StatsData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const trackDownload = createAsyncThunk(
  'stats/trackDownload',
  async (cvId: string, { rejectWithValue }) => {
    try {
      await apiFetch(`/cvs/${cvId}/download/`, {
        method: 'POST',
      });
      return cvId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default statsSlice.reducer;
