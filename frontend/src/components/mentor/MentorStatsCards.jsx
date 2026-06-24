import { BadgeCheck, MessageSquareWarning, RotateCcw, UsersRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function MentorStatsCards({ stats = {} }) {
  const cards = [
    ['Assigned students', stats.assignedStudentsCount, UsersRound],
    ['Pending evidence', stats.pendingEvidenceCount, MessageSquareWarning],
    ['Approved evidence', stats.approvedEvidenceCount, BadgeCheck],
    ['Changes requested', stats.changesRequestedCount, RotateCcw],
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <Card key={label} className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value || 0}</p></div><div className="rounded-2xl bg-brand-500/15 p-3 text-brand-200"><Icon className="h-6 w-6" /></div></Card>)}</div>;
}
