import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { inject } from '@vercel/analytics'
import { PostHogProvider } from '@posthog/react'
import { isAnalyticsOptedOut } from './utils/analytics'
import ErrorBoundary from './components/ErrorBoundary'

if (!isAnalyticsOptedOut()) {
  inject();
}

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
      <App />
    </PostHogProvider>
  </ErrorBoundary>
);
