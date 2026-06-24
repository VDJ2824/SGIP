import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loader } from '@/components/ui/Loader';
import { useAppContext } from '@/context/AppContext';

function GlobalLoadingOverlay() {
  const { globalLoading } = useAppContext();
  if (!globalLoading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-4">
      <div className="glass-panel rounded-full px-4 py-2">
        <Loader label="Updating SGIP workspace" />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppProvider>
        <AuthProvider>
          <ErrorBoundary>
            <GlobalLoadingOverlay />
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3200,
                style: {
                  background: 'rgba(252, 254, 252, 0.97)',
                  color: '#17312d',
                  border: '1px solid rgba(85, 119, 105, 0.2)',
                  borderRadius: '18px',
                  boxShadow: '0 16px 40px rgba(45, 72, 61, 0.16)',
                },
              }}
            />
          </ErrorBoundary>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
