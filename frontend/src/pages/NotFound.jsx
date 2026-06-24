import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function NotFound() {
  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center py-10">
      <Card className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-200">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The route you tried to open does not exist. Return to the dashboard or go back to the home experience.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/" variant="secondary" icon={ArrowLeft}>
            Home
          </Button>
          <Button as={Link} to="/dashboard">
            Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
