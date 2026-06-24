import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function display(key, value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return 'Not available';
  if (['overallProgress', 'currentReadinessScore', 'profileCompletion', 'evidenceCoverage', 'overallReadiness'].includes(key)) {
    return `${value}%`;
  }
  return String(value);
}

export function ReportSummary({ report }) {
  const simple = Object.entries(report || {}).filter(([key, value]) =>
    !['type','title','generatedAt','available','reportId','roadmapId'].includes(key) &&
    (typeof value !== 'object' || value === null));
  return <Card><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{simple.map(([key,value])=><div key={key} className="rounded-2xl bg-white/5 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g,' $1')}</p><p className="mt-2 text-lg font-semibold text-white">{display(key, value)}</p></div>)}</div></Card>;
}
