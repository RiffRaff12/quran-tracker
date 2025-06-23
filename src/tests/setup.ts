import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend matchers
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-admin-id' } },
        error: null
      })),
      admin: {
        createUser: vi.fn(() => ({
          data: { user: { id: 'new-user-id' } },
          error: null
        }))
      }
    },
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { is_admin: true },
            error: null
          }))
        })),
        order: vi.fn(() => ({
          data: [
            { id: '1', email: 'pending1@test.com', created_at: '2024-01-01' },
            { id: '2', email: 'pending2@test.com', created_at: '2024-01-02' }
          ],
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null }))
    }))
  }
})); 