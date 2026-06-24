import { Card } from '@/components/ui/Card';

export function AnalyticsCards({ analytics = {} }) {
  const items = [
    ['Role readiness average', analytics.roleReadinessScoreAverage, '%'],
    ['Evidence coverage', analytics.evidenceCoverage, '%'],
    ['Roadmap completion', analytics.roadmapCompletion, '%'],
    ['Assessment improvement', analytics.assessmentImprovement, '%'],
    ['Placement conversion', analytics.placementConversion, '%'],
    ['Pending mentor reviews', analytics.pendingMentorReviews, ''],
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value, suffix]) => <Card key={label}><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value || 0}{suffix}</p></Card>)}</div>;
}
