import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import authReducer, { setCredentials } from '../../store/slices/authSlice';
import cartReducer from '../../store/slices/cartSlice';
import uiReducer from '../../store/slices/uiSlice';
import type { User } from '../../types';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, cart: cartReducer, ui: uiReducer },
  });

const mockUser = (role: User['role'] = 'customer'): User => ({
  _id: 'u1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role,
  isActive: true,
  isEmailVerified: true,
  wishlist: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Renders the protected route at /protected, with /login and /home as fallback pages
const renderRoute = (
  store: ReturnType<typeof makeStore>,
  props: React.ComponentProps<typeof ProtectedRoute> = {}
) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route element={<ProtectedRoute {...props} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('ProtectedRoute', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
  });

  it('renders nothing while session is being restored (isLoading = true)', () => {
    // Default initial state has isLoading: true
    const { container } = renderRoute(store);
    expect(container.textContent).toBe('');
  });

  it('redirects to /auth/login when not authenticated', () => {
    // Settle loading but stay unauthenticated
    store.dispatch({ type: 'auth/restoreSession/rejected' });
    renderRoute(store);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser() }));
    renderRoute(store);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders content when authenticated and role matches allowedRoles', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser('admin') }));
    renderRoute(store, { allowedRoles: ['admin'] });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to default "/" when role does not match allowedRoles', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser('customer') }));
    renderRoute(store, { allowedRoles: ['admin'] });

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('honours custom redirectPath for role mismatch', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser('customer') }));

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/auth/login" element={<div>Login Page</div>} />
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} redirectPath="/unauthorized" />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('allows multiple roles — grants access to any matching role', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser('vendor') }));
    renderRoute(store, { allowedRoles: ['admin', 'vendor'] });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('accepts legacy "roles" prop for backward compatibility', () => {
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser('customer') }));
    renderRoute(store, { roles: ['customer'] });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
