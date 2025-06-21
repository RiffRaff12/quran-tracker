# Onboarding Flow Implementation

## Overview

This document describes the onboarding flow implementation for first-time users in the Quran Revision Tracker application.

## Database Schema

### Profiles Table

The `profiles` table stores user onboarding status and preferences:

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    has_completed_onboarding BOOLEAN DEFAULT false NOT NULL,
    memorised_surahs INTEGER[] DEFAULT '{}',
    goals JSONB DEFAULT '{"dailyRevisions": 5, "weeklyRevisions": 20, "memorizePerMonth": 1}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Automatic Profile Creation

A trigger automatically creates a profile record when a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

## Flow Implementation

### 1. Authentication Check

After login, the app checks the user's profile for `has_completed_onboarding`:

- **If `false`**: User is redirected to `/onboarding`
- **If `true`**: User is redirected to the main home screen (`/`)

### 2. Onboarding Screen

The onboarding screen (`/onboarding`) allows users to:

- View a welcome message explaining the app
- Search through all 114 surahs
- Multi-select memorized surahs using checkboxes
- Submit their selection

### 3. Data Persistence

When onboarding is completed:

1. **Profile Update**: Sets `has_completed_onboarding = true` and saves selected surah IDs to `memorised_surahs`
2. **Surah Revisions Initialization**: Creates initial revision records for selected surahs in the `surah_revisions` table
3. **Navigation**: Redirects user to the main home screen

## Key Components

### `useOnboarding` Hook

```typescript
const { hasCompletedOnboarding, isLoading, error, profile } = useOnboarding();
```

This hook manages onboarding state and provides loading states for better UX.

### `OnboardingScreen` Component

A wrapper component that handles navigation after onboarding completion.

### `updateUserOnboarding` Function

Handles the complete onboarding process including profile updates and surah revision initialization.

## Routing Logic

The app uses React Router with protected routes:

- `/` - Main home screen (requires completed onboarding)
- `/onboarding` - Onboarding screen (redirects if already completed)
- `*` - 404 page

## Error Handling

- Loading states during profile fetching
- Error handling for database operations
- Toast notifications for success/error feedback

## Security

- Row Level Security (RLS) enabled on profiles table
- Users can only access their own profile data
- Proper authentication checks before any operations 