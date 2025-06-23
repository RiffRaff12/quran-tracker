import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from './Auth';
import { renderWithProviders } from '@/tests/test-utils';
import { supabase } from '@/lib/supabaseClient';

describe('Auth (Invite-Only Registration)', () => {
  it('shows pending approval message after submitting email', async () => {
    renderWithProviders(<Auth />);
    const input = screen.getByPlaceholderText(/your email/i);
    const button = screen.getByRole('button', { name: /request access/i });
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      // Check for the main message in the card
      expect(screen.getByText(/your registration is pending admin approval/i, { selector: '.text-center' })).toBeInTheDocument();
    });
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('handles registration error', async () => {
    // Mock error response
    const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
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
    const input = screen.getByPlaceholderText(/your email/i);
    const button = screen.getByRole('button', { name: /request access/i });
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/database error/i)).toBeInTheDocument();
    });
  });
}); 