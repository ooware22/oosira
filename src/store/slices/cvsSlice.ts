import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../api/apiClient';

export interface DraftCV {
  id: string;
  title: string;
  jobTitle: string;
  lastEdited: string;
  completionPercent: number;
  status: 'draft' | 'completed' | 'shared';
  templateName: string;
  previewColor: string;
}

interface CVsState {
  drafts: DraftCV[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CVsState = {
  drafts: [],
  status: 'idle',
  error: null,
};

// ── Fetch all CVs ──
export const fetchDrafts = createAsyncThunk('cvs/fetchDrafts', async () => {
  const data = await apiFetch('/cvs/');
  return data as DraftCV[];
});

// ── Create a new CV ──
export const createDraft = createAsyncThunk(
  'cvs/createDraft',
  async (cvData: Partial<DraftCV>) => {
    const data = await apiFetch('/cvs/', {
      method: 'POST',
      body: JSON.stringify(cvData),
    });
    return data as DraftCV;
  }
);

// ── Delete a CV ──
export const removeDraft = createAsyncThunk('cvs/removeDraft', async (id: string) => {
  await apiFetch(`/cvs/${id}/`, { method: 'DELETE' });
  return id;
});

// ── Duplicate a CV ──
export const duplicateDraft = createAsyncThunk('cvs/duplicateDraft', async (id: string) => {
  const data = await apiFetch(`/cvs/${id}/duplicate/`, { method: 'POST' });
  return data as DraftCV;
});

const cvsSlice = createSlice({
  name: 'cvs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrafts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.drafts = action.payload;
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch drafts';
      })
      .addCase(createDraft.fulfilled, (state, action) => {
        state.drafts.unshift(action.payload);
      })
      .addCase(removeDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload);
      })
      .addCase(duplicateDraft.fulfilled, (state, action) => {
        state.drafts.unshift(action.payload);
      });
  },
});

export default cvsSlice.reducer;
