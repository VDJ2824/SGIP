import { Activity, BadgeCheck, BriefcaseBusiness, Sparkles, UserRoundCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const cards = [
  ['totalStudents', 'Students', Users],
  ['totalMentors', 'Mentors', UserRoundCheck],
  ['pendingEvidenceReviews', 'Pending evidence', BadgeCheck],
  ['pendingAiRoles', 'AI roles to review', Sparkles],
  ['totalCareerRoles', 'Career roles', BriefcaseBusiness],
  ['averageReadinessScore', 'Average readiness', Activity],
];

export function AdminStatsCards({ stats = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([key, label, Icon]) => (
        <Card key={key} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stats[key] ?? 0}{key === 'averageReadinessScore' ? '%' : ''}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-200"><Icon className="h-6 w-6" /></div>
        </Card>
      ))}
    </div>
  );
}
