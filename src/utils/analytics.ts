import posthog from 'posthog-js';
import { getAnalyticsMetadata, setAnalyticsMetadata, getAllSurahRevisions } from './idbManager';
import { getUserProfile, getAllRevisionLogs } from './dataManager';

// Generate a random anonymous ID
function generateAnonymousId(): string {
  return 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Initialises anonymous identity and fires returning_user if applicable.
 * Pass the posthog instance from usePostHog() so we know it's ready.
 */
export async function initAnalytics(ph: typeof posthog): Promise<void> {
  try {
    let meta = await getAnalyticsMetadata();

    if (!meta) {
      meta = {
        anonymousId: generateAnonymousId(),
        installDate: new Date().toISOString(),
      };
      await setAnalyticsMetadata(meta);
    }

    // Link all sessions to the same anonymous user
    ph.identify(meta.anonymousId);

    // Fire returning_user if the user has any memorised surahs
    // Profile store may be empty; fall back to checking surahRevisions directly
    const profile = await getUserProfile();
    const surahRevisions = await getAllSurahRevisions();
    const isReturning = profile.hasCompletedOnboarding || profile.memorisedSurahs.length > 0 || surahRevisions.length > 0;

    console.log('[analytics] profile:', profile);
    console.log('[analytics] surahRevisions count:', surahRevisions.length);
    console.log('[analytics] isReturning:', isReturning);

    if (isReturning) {
      const installDate = new Date(meta.installDate);
      const daysSinceInstall = Math.floor(
        (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('[analytics] firing returning_user, days:', daysSinceInstall);
      ph.capture('returning_user', { days_since_install: daysSinceInstall });
    }
  } catch (err) {
    console.error('[analytics] initAnalytics error:', err);
  }
}

/**
 * Fires revision_logged every time a revision is rated.
 * Also fires first_revision_logged if this is the user's very first revision.
 */
export async function trackRevisionLogged(
  rating: 'easy' | 'medium' | 'hard',
  surahName: string
): Promise<void> {
  try {
    const logs = await getAllRevisionLogs();
    const isFirst = logs.length === 1; // log was just added before this call

    posthog.capture('revision_logged', { rating });

    if (isFirst) {
      posthog.capture('first_revision_logged', { rating, surah_name: surahName });
    }
  } catch {
    // Analytics must never break the app
  }
}

/**
 * Fires onboarding_completed when the user saves their first memorised surahs.
 */
export function trackOnboardingCompleted(surahCount: number): void {
  try {
    posthog.capture('onboarding_completed', { surah_count: surahCount });
  } catch {
    // Analytics must never break the app
  }
}
