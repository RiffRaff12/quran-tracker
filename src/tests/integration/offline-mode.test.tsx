import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Index from '@/pages/Index';
import * as idbManager from '@/utils/idbManager';

// Helper to simulate offline mode
defineGlobalOffline();
function defineGlobalOffline() {
  Object.defineProperty(window.navigator, 'onLine', {
    value: false,
    writable: true,
    configurable: true,
  });
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Offline'))));
}

describe('Offline Mode', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    const db = await idbManager.getDB();
    db.close();
    indexedDB.deleteDatabase('ayat-revision-db');
  });

  it('should allow adding and retrieving data while offline', async () => {
    render(<Index />);

    // Simulate adding a surah revision (this depends on your UI, so adjust as needed)
    // For example, if SurahManager allows adding a memorized surah:
    // 1. Switch to Surahs tab
    fireEvent.click(screen.getByRole('button', { name: /surahs/i }));
    // 2. Find a surah to mark as memorized (adjust selector as needed)
    const surahButton = await screen.findAllByRole('button', { name: /memorize|mark as memorized/i });
    fireEvent.click(surahButton[0]);

    // 3. Check that the surah is now marked as memorized in the UI
    // (Adjust selector as needed for your UI)
    await waitFor(() => {
      expect(screen.getByText(/memorized/i)).toBeInTheDocument();
    });

    // 4. Reload the component and check data persists
    render(<Index />);
    fireEvent.click(screen.getByRole('button', { name: /surahs/i }));
    await waitFor(() => {
      expect(screen.getByText(/memorized/i)).toBeInTheDocument();
    });
  });
}); 