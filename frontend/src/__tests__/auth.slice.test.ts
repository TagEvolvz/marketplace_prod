import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginUser,
  restoreSession,
  fetchCurrentUser,
  setCredentials,
  setUser,
  logout,
  updateUser,
} from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import type { User } from '../../types';

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
  },
}));

// Store factory — each test gets an isolated store
const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
  });

const mockUser: User = {
  _id: 'user-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  role: 'customer',
  isActive: true,
  isEmailVerified: true,
  wishlist: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('authSlice — reducers', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  it('starts with correct initial state', () => {
    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.isLoading).toBe(true); // true until restoreSession resolves
  });

  it('setCredentials sets token and marks authenticated', () => {
    store.dispatch(setCredentials({ accessToken: 'tok-123', user: mockUser }));
    const { auth } = store.getState();

    expect(auth.accessToken).toBe('tok-123');
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isLoading).toBe(false);
    expect(auth.user).toEqual(mockUser);
  });

  it('setCredentials without user does not clear existing user', () => {
    store.dispatch(setUser(mockUser));
    store.dispatch(setCredentials({ accessToken: 'new-tok' }));

    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.accessToken).toBe('new-tok');
  });

  it('setUser updates the stored user', () => {
    store.dispatch(setUser(mockUser));
    expect(store.getState().auth.user).toEqual(mockUser);
  });

  it('updateUser merges partial fields', () => {
    store.dispatch(setUser(mockUser));
    store.dispatch(updateUser({ firstName: 'Updated' }));

    const { user } = store.getState().auth;
    expect(user?.firstName).toBe('Updated');
    expect(user?.lastName).toBe('Doe'); // unchanged
  });

  it('updateUser is a no-op when no user is stored', () => {
    store.dispatch(updateUser({ firstName: 'Ghost' }));
    expect(store.getState().auth.user).toBeNull();
  });

  it('logout clears all auth state', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser }));
    store.dispatch(logout());

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
  });

  it('logout calls authAPI.logout to clear the server cookie', () => {
    store.dispatch(logout());
    expect(authAPI.logout).toHaveBeenCalledTimes(1);
  });
});

describe('authSlice — loginUser thunk', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  it('fulfilled: stores user and token, marks authenticated', async () => {
    vi.mocked(authAPI.login).mockResolvedValueOnce({
      data: { data: { user: mockUser, accessToken: 'access-tok' } },
    } as never);

    await store.dispatch(loginUser({ email: 'jane@example.com', password: 'Password1' }));

    const { auth } = store.getState();
    expect(auth.user).toEqual(mockUser);
    expect(auth.accessToken).toBe('access-tok');
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isLoading).toBe(false);
  });

  it('rejected: does not modify user or token', async () => {
    vi.mocked(authAPI.login).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    await store.dispatch(loginUser({ email: 'jane@example.com', password: 'wrong' }));

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
  });

  it('pending: sets isLoading to true', () => {
    vi.mocked(authAPI.login).mockReturnValueOnce(new Promise(() => {}) as never);
    store.dispatch(loginUser({ email: 'jane@example.com', password: 'Password1' }));

    expect(store.getState().auth.isLoading).toBe(true);
  });
});

describe('authSlice — restoreSession thunk', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  it('fulfilled: restores user and marks authenticated', async () => {
    vi.mocked(authAPI.getMe).mockResolvedValueOnce({
      data: { data: mockUser },
    } as never);

    await store.dispatch(restoreSession());

    const { auth } = store.getState();
    expect(auth.user).toEqual(mockUser);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isLoading).toBe(false);
  });

  it('rejected: clears auth state gracefully (no active session)', async () => {
    vi.mocked(authAPI.getMe).mockRejectedValueOnce(new Error('No session'));

    await store.dispatch(restoreSession());

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.isLoading).toBe(false); // must stop loading even on failure
  });
});

describe('authSlice — fetchCurrentUser thunk', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  it('fulfilled: updates user in state', async () => {
    const updatedUser = { ...mockUser, firstName: 'NewName' };
    vi.mocked(authAPI.getMe).mockResolvedValueOnce({
      data: { data: updatedUser },
    } as never);

    await store.dispatch(fetchCurrentUser());

    expect(store.getState().auth.user?.firstName).toBe('NewName');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it('rejected: clears user and token', async () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser }));
    vi.mocked(authAPI.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

    await store.dispatch(fetchCurrentUser());

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.accessToken).toBeNull();
  });
});
