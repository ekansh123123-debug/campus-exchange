import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client.js';
import { ToastProvider } from '../components/ToastContext.jsx';
import { AuthProvider } from '../features/auth/AuthContext.jsx';

export function AppProviders({ children, RouterComponent = BrowserRouter, routerProps = {} }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterComponent {...routerProps}>{children}</RouterComponent>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
