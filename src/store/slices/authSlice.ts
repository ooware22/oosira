import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockApi } from '../../api/mockData';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  // Initialize with dummy data for immediate access in the builder/dashboard without logging in for now
  user: {
    id: 'user_1',
    name: 'Islem Charaf Eddine',
    email: 'islem@oosira.com',
    plan: 'pro'
  },
  isAuthenticated: true,
  status: 'idle',
  error: null,
};

export const loginAuth = createAsyncThunk('auth/login', async (credentials: any) => {
  const response = await mockApi.auth.login(credentials);
  return response;
});

export const logoutAuth = createAsyncThunk('auth/logout', async () => {
  await mockApi.auth.logout();
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logoutAuth.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      });
  },
});

export default authSlice.reducer;
