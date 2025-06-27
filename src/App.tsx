import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import AdminPendingUsers from './pages/AdminPendingUsers';
import * as pushNotifications from './utils/pushNotifications';

const queryClient = new QueryClient();

function App() {
  // Notification permission and listener setup
  useEffect(() => {
    (async () => {
      const granted = await pushNotifications.requestNotificationPermission();
      if (!granted) {
        // Optionally show UI to prompt user to enable notifications
        console.log('User did not grant notification permissions');
      }
      // Listen for notification actions (optional: handle navigation, etc.)
      pushNotifications.listenForNotificationActions((action) => {
        console.log('Notification action performed:', action);
      });
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router future={{ v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/pending-users" element={<AdminPendingUsers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
