import { Card } from '@/components/ui/Card';

export function ReadinessScoreCard({ score = 0 }) {
  const tone = score >= 75 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700';
  return (
    <Card>
      <p className="text-sm text-slate-400">Overall readiness</p>
      <p className={`mt-3 text-6xl font-semibold ${tone}`}>{Math.round(score)}%</p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400" style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Deterministic total of the five weighted scoring dimensions. AI does not calculate or modify this score.
      </p>
    </Card>
  );
}
