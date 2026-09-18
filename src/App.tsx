import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, useToast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { ViewRouter } from './components/layout/ViewRouter';
import { AuthView } from './features/auth/AuthView';
import { useAppStore } from './stores/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function MainContent() {
  const currentView = useAppStore((state) => state.currentView);
  const currentRole = useAppStore((state) => state.currentRole);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);
  const { showToast } = useToast();

  if (currentView === 'auth') {
    return (
      <AuthView
        initialRole={currentRole}
        onCancel={() => setCurrentView('dashboard')}
        onLoginSuccess={(user) => {
          setCurrentRole(user.role);
          setCurrentView(user.role === 'SIGNINN Super Admin' ? 'superadmin' : 'dashboard');
          showToast({
            title: `Welcome, ${user.name}`,
            description: `Signed in as ${user.role} • ${user.hotelName || 'SIGNINN HMS'}`,
            type: 'success',
          });
        }}
      />
    );
  }

  return (
    <AppLayout>
      <ViewRouter />
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}
