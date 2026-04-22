import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, setToken, setRefreshToken, clearToken, getToken } from '../../api/apiClient';

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
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
};

// ── Login ──
export const loginAuth = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const data = await apiFetch('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store tokens
    setToken(data.token);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  }
);

// ── Register ──
export const registerAuth = createAsyncThunk(
  'auth/register',
  async (credentials: { name: string; email: string; password: string }) => {
    const data = await apiFetch('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store tokens
    setToken(data.token);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  }
);

// ── Logout ──
export const logoutAuth = createAsyncThunk('auth/logout', async () => {
  clearToken();
  return null;
});

// ── Hydrate (restore session from localStorage on app load) ──
export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const token = getToken();
  if (!token) throw new Error('No token');
  const data = await apiFetch('/users/profile/');
  return data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
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
      // Register
      .addCase(registerAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(registerAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Registration failed';
      })
      // Logout
      .addCase(logoutAuth.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      })
      // Hydrate
      .addCase(hydrateAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.status = 'succeeded';
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'failed';
      });
  },
});

export default authSlice.reducer;
