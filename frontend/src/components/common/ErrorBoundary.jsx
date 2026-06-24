import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="glass-panel max-w-xl rounded-3xl p-8">
            <ErrorMessage
              title="Application error"
              message={this.state.error?.message || 'An unexpected error interrupted the dashboard.'}
              icon={AlertTriangle}
            />
            <div className="mt-6">
              <Button variant="primary" onClick={() => window.location.reload()} icon={RefreshCcw}>
                Reload app
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
