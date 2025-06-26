import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import { supabase } from '@/lib/supabaseClient';
import Auth from '@/components/Auth';
import Index from '@/pages/Index';

vi.mock('@/lib/supabaseClient');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => {
  const actual = require('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Auth Flow Integration', () => {
  const testEmail = 'user1@test.com';
  const testPassword = 'password123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user and redirects to onboarding if not completed', async () => {
    // Mock Supabase signUp
    (supabase.auth as any) = {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    };
    (supabase.from as any) = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { has_completed_onboarding: false }, error: null }),
    });

    renderWithProviders(<Auth />);
    // Click the Register tab (toggle)
    const registerTab = screen.getAllByRole('button', { name: /register/i }).find(btn => (btn as HTMLButtonElement).type === 'button');
    fireEvent.click(registerTab!);
    fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: testEmail } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: testPassword } });
    // Click the Register submit button
    const registerSubmit = screen.getAllByRole('button', { name: /register/i }).find(btn => (btn as HTMLButtonElement).type === 'submit');
    fireEvent.click(registerSubmit!);

    await waitFor(() => {
      expect((supabase.auth as any).signUp).toHaveBeenCalledWith({ email: testEmail, password: testPassword });
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
  });

  it('logs in an existing user and redirects to home if onboarding is complete', async () => {
    (supabase.auth as any) = {
      signUp: vi.fn(),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null }),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    };
    (supabase.from as any) = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { has_completed_onboarding: true }, error: null }),
    });

    renderWithProviders(<Auth />);
    // Click the Login tab (toggle)
    const loginTab = screen.getAllByRole('button', { name: /login/i }).find(btn => (btn as HTMLButtonElement).type === 'button');
    fireEvent.click(loginTab!);
    fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: testEmail } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: testPassword } });
    // Click the Login submit button
    const loginSubmit = screen.getAllByRole('button', { name: /login/i }).find(btn => (btn as HTMLButtonElement).type === 'submit');
    fireEvent.click(loginSubmit!);

    await waitFor(() => {
      expect((supabase.auth as any).signInWithPassword).toHaveBeenCalledWith({ email: testEmail, password: testPassword });
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('logs out and redirects to login/register screen', async () => {
    (supabase.auth as any) = {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-3' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    };
    // Render only the Index page to avoid double Router
    renderWithProviders(<Index />);
    // Find and click the Logout button (should be present in header)
    const logoutButton = screen.getAllByText(/logout/i)[0];
    fireEvent.click(logoutButton);
    await waitFor(() => {
      expect((supabase.auth as any).signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
}); 