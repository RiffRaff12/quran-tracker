import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import OnboardingScreen from './pages/OnboardingScreen';
import NotFound from './pages/NotFound';
import { supabase } from './lib/supabaseClient';
import Auth from '@/components/Auth';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { useOnboarding } from '@/hooks/use-onboarding';

const queryClient = new QueryClient();

// Component to handle authenticated routing
const AuthenticatedApp = () => {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-emerald-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          hasCompletedOnboarding ? (
            <Index />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          hasCompletedOnboarding ? (
            <Navigate to="/" replace />
          ) : (
            <OnboardingScreen />
          )
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <div className="App">
            {!session ? (
              <Auth />
            ) : (
              <AuthenticatedApp />
            )}
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
