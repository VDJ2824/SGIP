import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RoleSelector({ role, onSelect, selecting = false }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-white/5 to-accent-500/10 p-5">
      <p className="text-sm text-slate-400">Selected target role</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{role?.title || 'Choose a target career role'}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {role
          ? 'This role will drive gap analysis, roadmap alignment, and dashboard readiness tracking.'
          : 'Search the catalog or generate a new role only when the catalog does not already contain an equivalent one.'}
      </p>
      <Button className="mt-5" onClick={() => onSelect?.(role)} disabled={!role} isLoading={selecting} icon={ArrowRight}>
        Select And Continue To Gap Analysis
      </Button>
    </div>
  );
}

