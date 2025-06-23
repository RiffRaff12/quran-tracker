import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import { supabase } from '@/lib/supabaseClient';
import AdminPendingUsers from '@/pages/AdminPendingUsers';

describe('Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents unauthenticated users from accessing admin page', async () => {
    // Mock no authenticated user
    vi.mocked(supabase.auth.getUser).mockImplementationOnce(() =>
      Promise.resolve({ data: { user: null }, error: null })
    );

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  it('prevents non-admin users from accessing admin page', async () => {
    // Mock authenticated but non-admin user
    vi.mocked(supabase.auth.getUser).mockImplementationOnce(() =>
      Promise.resolve({
        data: { user: { id: 'regular-user-id' } as any },
        error: null
      })
    );

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { is_admin: false },
            error: null
          }))
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      url: '',
      headers: {},
    } as any));

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  it('allows admin users to access admin page', async () => {
    // Mock authenticated admin user
    vi.mocked(supabase.auth.getUser).mockImplementationOnce(() =>
      Promise.resolve({
        data: { user: { id: 'admin-user-id' } as any },
        error: null
      })
    );

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { is_admin: true },
            error: null
          }))
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      url: '',
      headers: {},
    } as any));

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(/pending user registrations/i)).toBeInTheDocument();
    });
  });

  it('prevents users from approving their own registration', async () => {
    // Mock authenticated non-admin user trying to access their own pending registration
    const userEmail = 'user@example.com';
    
    vi.mocked(supabase.auth.getUser).mockImplementationOnce(() =>
      Promise.resolve({
        data: { user: { id: 'user-id', email: userEmail } as any },
        error: null
      })
    );

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { is_admin: false },
            error: null
          }))
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      url: '',
      headers: {},
    } as any));

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      // Verify the user can't see their own pending registration
      expect(screen.queryByText(userEmail)).not.toBeInTheDocument();
    });
  });
}); 