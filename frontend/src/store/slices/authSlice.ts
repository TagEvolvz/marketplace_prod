import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../../types';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
// [WARNING]️  Security: Access token stored ONLY in memory (Redux state).
//     Refresh token lives in an HTTP-only cookie managed server-side.
//     Never persist access tokens to localStorage — they're XSS-vulnerable.

const initialAuthState: AuthState = {
  user: null,
  accessToken: null,       // in-memory only, never localStorage
  isAuthenticated: false,
  isLoading: false,        // default false so auth pages render immediately
};

// On app boot, try to restore session via /auth/me.
// The axios interceptor will automatically use the HTTP-only cookie to refresh
// the access token if needed, so this works even after a hard refresh.
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      return response.data.data;
    } catch {
      return rejectWithValue('No active session');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data.data;
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      return rejectWithValue(msg);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      return response.data.data;
    } catch {
      return rejectWithValue('Failed to fetch user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    // Called by the axios interceptor after a successful silent token refresh
    setCredentials: (state, action: PayloadAction<{ accessToken: string; user?: User }>) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (action.payload.user) state.user = action.payload.user;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Tell the server to clear the HTTP-only refresh cookie
      authAPI.logout().catch(() => {});
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── restoreSession ──────────────────────────────────────────────────────
      .addCase(restoreSession.pending, (state) => { state.isLoading = true; })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      })
      // ── loginUser ───────────────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => { state.isLoading = true; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        toast.success(`Welcome back, ${action.payload.user.firstName}!`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload as string);
      })
      // ── fetchCurrentUser ────────────────────────────────────────────────────
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.isLoading = false;
      });
  },
});

export const { setCredentials, setUser, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
