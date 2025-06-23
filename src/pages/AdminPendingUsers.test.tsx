import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import AdminPendingUsers from './AdminPendingUsers';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-admin-id' } }
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
  };
  return { supabase: mockSupabase };
});

describe('AdminPendingUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows access denied for non-admin users', async () => {
    // Mock non-admin user
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { is_admin: false },
            error: null
          }))
        }))
      }))
    } as any));

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  it('displays pending users list for admin users', async () => {
    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText('pending1@test.com')).toBeInTheDocument();
      expect(screen.getByText('pending2@test.com')).toBeInTheDocument();
    });
  });

  it('handles user approval successfully', async () => {
    // Mock successful user creation
    vi.mocked(supabase.auth.admin.createUser).mockImplementationOnce(() =>
      Promise.resolve({
        data: { user: { id: 'new-user-id' } as any },
        error: null
      })
    );

    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText('pending2@test.com')).toBeInTheDocument();
    });

    const approveButton = screen.getAllByText('Approve')[0];
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getAllByText(/user approved/i)).toHaveLength(2); // Toast + notification
    });
  });

  it('handles user rejection successfully', async () => {
    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText('pending2@test.com')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByText('Reject')[0];
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getAllByText(/user rejected/i)).toHaveLength(2); // Toast + notification
    });
  });
}); 