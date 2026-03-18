import posthog from 'posthog-js';
import { getAnalyticsMetadata, setAnalyticsMetadata } from './idbManager';
import { getUserProfile, getAllRevisionLogs } from './dataManager';

// Generate a random anonymous ID
function generateAnonymousId(): string {
  return 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Initialises anonymous identity and fires returning_user if applicable.
 * Call once on app mount.
 */
export async function initAnalytics(): Promise<void> {
  try {
    let meta = await getAnalyticsMetadata();

    if (!meta) {
      // First ever visit — create anonymous ID and record install date
      meta = {
        anonymousId: generateAnonymousId(),
        installDate: new Date().toISOString(),
      };
      await setAnalyticsMetadata(meta);
    }

    // Link all sessions to the same anonymous user
    posthog.identify(meta.anonymousId);

    // Fire returning_user if onboarding was previously completed
    const profile = await getUserProfile();
    if (profile.hasCompletedOnboarding) {
      const installDate = new Date(meta.installDate);
      const daysSinceInstall = Math.floor(
        (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      posthog.capture('returning_user', { days_since_install: daysSinceInstall });
    }
  } catch {
    // Analytics must never break the app
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
