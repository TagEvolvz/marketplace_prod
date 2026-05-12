import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Silence react-hot-toast in tests
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// socket.io-client is network-bound — mock it globally
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

// Silence console.error for known React test noise (act warnings etc.)
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (
    msg.includes('Warning: ReactDOM.render') ||
    msg.includes('act(') ||
    msg.includes('not wrapped in act')
  ) {
    return;
  }
  originalError(...args);
};
