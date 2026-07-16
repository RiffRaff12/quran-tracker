import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OnboardingScreen from './pages/OnboardingScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import * as pushNotifications from './utils/pushNotifications';
import { initAnalytics } from './utils/analytics';
import { usePostHog } from '@posthog/react';

const queryClient = new QueryClient();

function App() {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    initAnalytics(posthog);
    pushNotifications.requestNotificationPermission();
  }, [posthog]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router future={{ v7_relativeSplatPath: true }}>
          <div className="App min-h-screen flex flex-col">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
