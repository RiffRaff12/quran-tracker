import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import { supabase } from '@/lib/supabaseClient';
import Auth from '@/components/Auth';
import AdminPendingUsers from '@/pages/AdminPendingUsers';

describe('Registration Flow Integration', () => {
  const testEmail = 'pending1@test.com'; // Use email from mock data

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes full registration flow: signup -> admin approval -> profile creation', async () => {
    // 1. User submits registration
    renderWithProviders(<Auth />);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const submitButton = screen.getByRole('button', { name: /request access/i });

    fireEvent.change(emailInput, { target: { value: testEmail } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/your registration is pending admin approval/i, { selector: '.text-center' })).toBeInTheDocument();
    });

    // 2. Admin views and approves registration
    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });

    const approveButton = screen.getAllByText('Approve')[0];
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getAllByText(/user approved/i)).toHaveLength(2); // Toast + notification
    });

    // Verify Supabase calls
    expect(supabase.from).toHaveBeenCalledWith('pending_users');
    expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
      email: testEmail,
      email_confirm: false,
    });
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
  });

  it('handles registration rejection flow', async () => {
    // 1. User submits registration
    renderWithProviders(<Auth />);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const submitButton = screen.getByRole('button', { name: /request access/i });

    fireEvent.change(emailInput, { target: { value: testEmail } });
    fireEvent.click(submitButton);

    // 2. Admin rejects registration
    renderWithProviders(<AdminPendingUsers />);
    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByText('Reject')[0];
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getAllByText(/user rejected/i)).toHaveLength(2); // Toast + notification
      expect(screen.queryByText(testEmail)).not.toBeInTheDocument();
    });

    // Verify user was removed from pending_users
    expect(supabase.from).toHaveBeenCalledWith('pending_users');
    expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
  });
}); 