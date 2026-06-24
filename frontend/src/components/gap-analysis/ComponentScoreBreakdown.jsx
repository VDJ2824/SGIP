import { Card } from '@/components/ui/Card';

const labels = {
  profileCompleteness: 'Profile completeness',
  coreEligibility: 'Core eligibility',
  evidenceStrength: 'Evidence strength',
  compatibility: 'Compatibility',
  trustAndRecency: 'Trust and recency',
};

export function ComponentScoreBreakdown({ scores = {} }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Component scores</h2>
      <div className="mt-5 space-y-4">
        {Object.entries(scores).map(([key, score]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{labels[key] || key}</p>
                <p className="mt-1 text-sm text-slate-400">{score.explanation}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-white">{score.rawScore}%</p>
                <p className="text-xs text-slate-500">{score.weightedScore} / {score.maxWeight}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
