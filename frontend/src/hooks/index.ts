import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store';
import { logout, fetchCurrentUser } from '../store/slices/authSlice';
import { setCart, setCartLoading } from '../store/slices/cartSlice';
import { cartAPI } from '../services/api';

// ─── useAuth ──────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, accessToken } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/auth/login');
    toast.success('Logged out successfully');
  }, [dispatch, navigate]);

  const requireAuth = useCallback(
    (redirectTo = '/auth/login') => {
      if (!isAuthenticated) {
        navigate(redirectTo);
        return false;
      }
      return true;
    },
    [isAuthenticated, navigate]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    logout: handleLogout,
    requireAuth,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  };
};

// ─── useCart ──────────────────────────────────────────────────────────────────
export const useCart = () => {
  const dispatch = useAppDispatch();
  const { cart, isLoading, itemCount } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    dispatch(setCartLoading(true));
    try {
      const res = await cartAPI.getCart();
      dispatch(setCart(res.data.data));
    } catch {
      // ignore
    } finally {
      dispatch(setCartLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return { cart, isLoading, itemCount, refetch: fetchCart };
};

// ─── useSocket ────────────────────────────────────────────────────────────────
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WS_URL || 'http://localhost:5000',
      {
        auth: { token: accessToken },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      if (import.meta.env.DEV) console.log('[Socket] Connected:', socket.id);
    });
    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) console.log('[Socket] Disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      if (import.meta.env.DEV) console.error('[Socket] Error:', err.message);
    });

    socket.on('notification', (data: { type: string; title: string; message: string }) => {
      const toastFn = data.type === 'error' ? toast.error : toast.success;
      toastFn(`${data.title}: ${data.message}`, { duration: 6000 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
};

// ─── useOrderTracking ─────────────────────────────────────────────────────────
/** Subscribe to real-time status updates for a specific order. */
export const useOrderTracking = (orderId: string | undefined) => {
  const socket = useSocket();
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('trackOrder', orderId);
    const handler = (data: { status: string; updatedAt: string }) => {
      setStatus(data.status);
      setLastUpdate(new Date(data.updatedAt));
      toast.success(`Order status updated: ${data.status}`);
    };
    socket.on('orderUpdate', handler);

    return () => {
      socket.emit('untrackOrder', orderId);
      socket.off('orderUpdate', handler);
    };
  }, [socket, orderId]);

  return { liveStatus: status, lastUpdate };
};

// ─── useDebounce ──────────────────────────────────────────────────────────────
export const useDebounce = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};

// ─── useClickOutside ──────────────────────────────────────────────────────────
export const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
};

// ─── useIntersectionObserver ──────────────────────────────────────────────────
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
};
