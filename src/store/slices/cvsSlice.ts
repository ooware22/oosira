import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockApi } from '../../api/mockData';

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

export const fetchDrafts = createAsyncThunk('cvs/fetchDrafts', async () => {
  const response = await mockApi.cvs.getAll();
  return response as DraftCV[];
});

export const removeDraft = createAsyncThunk('cvs/removeDraft', async (id: string) => {
  await mockApi.cvs.delete(id);
  return id;
});

export const duplicateDraft = createAsyncThunk('cvs/duplicateDraft', async (id: string) => {
  const response = await mockApi.cvs.duplicate(id);
  return response as DraftCV;
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
      .addCase(removeDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload);
      })
      .addCase(duplicateDraft.fulfilled, (state, action) => {
        state.drafts.unshift(action.payload);
      });
  },
});

export default cvsSlice.reducer;
