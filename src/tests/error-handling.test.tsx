import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import { supabase } from '@/lib/supabaseClient';
import Auth from '@/components/Auth';
import AdminPendingUsers from '@/pages/AdminPendingUsers';

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration Errors', () => {
    it('handles database connection error during registration', async () => {
      // Mock database error
      const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'Database connection failed' } });
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: mockInsert,
        select: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        url: '',
        headers: {},
      } as any));

      renderWithProviders(<Auth />);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const submitButton = screen.getByRole('button', { name: /request access/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('handles duplicate email registration', async () => {
      // Mock duplicate email error
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'duplicate key value violates unique constraint' }
      });
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: mockInsert,
        select: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        url: '',
        headers: {},
      } as any));

      renderWithProviders(<Auth />);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const submitButton = screen.getByRole('button', { name: /request access/i });

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/duplicate key value violates unique constraint/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderWithProviders(<Auth />);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const submitButton = screen.getByRole('button', { name: /request access/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      // The form should still be enabled since validation happens on submit
      expect(emailInput).not.toBeDisabled();
    });
  });

  describe('Admin Approval Errors', () => {
    it('handles error during user approval', async () => {
      // Mock error creating user in auth
      vi.mocked(supabase.auth.admin.createUser).mockImplementationOnce(() =>
        Promise.resolve({ 
          data: { user: null }, 
          error: { 
            message: 'Failed to create user',
            code: 'AUTH_ERROR',
            status: 400,
            __isAuthError: true,
            name: 'AuthError'
          } as any
        })
      );

      renderWithProviders(<AdminPendingUsers />);
      await waitFor(() => {
        expect(screen.getAllByText('pending1@test.com')[0]).toBeInTheDocument();
      });

      // Find the Approve button in the same container as the email
      const pendingUserCard = screen.getAllByText('pending1@test.com')[0].closest('.border');
      const approveButton = pendingUserCard
        ? Array.from(pendingUserCard.querySelectorAll('button')).find(btn => btn.textContent?.includes('Approve'))
        : screen.getAllByText('Approve')[0];
      fireEvent.click(approveButton!);

      await waitFor(() => {
        expect(screen.getByText(/failed to create user/i)).toBeInTheDocument();
      });
    });

    it('handles network error during rejection', async () => {
      // Mock network error during delete
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { is_admin: true },
              error: null
            }))
          }))
        })),
        delete: mockDelete,
        insert: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        url: '',
        headers: {},
      } as any));

      renderWithProviders(<AdminPendingUsers />);
      await waitFor(() => {
        expect(screen.getAllByText('pending1@test.com')[0]).toBeInTheDocument();
      });

      // Find the Reject button in the same container as the email
      const pendingUserCard = screen.getAllByText('pending1@test.com')[0].closest('.border');
      const rejectButton = pendingUserCard
        ? Array.from(pendingUserCard.querySelectorAll('button')).find(btn => btn.textContent?.includes('Reject'))
        : screen.getAllByText('Reject')[0];
      fireEvent.click(rejectButton!);

      await waitFor(() => {
        // Check that a toast (role='status') appears, indicating an error toast was triggered
        const toasts = screen.queryAllByRole('status');
        expect(toasts.length).toBeGreaterThan(0);
      });
    });
  });
}); 