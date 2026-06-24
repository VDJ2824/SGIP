import { PageHeader } from '@/components/common/PageHeader';
import { AnalyticsCards } from '@/components/admin/AnalyticsCards';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getAdminAnalytics } from '@/services/adminService';

function Ranking({ title, items = [] }) {
  return <Card><h2 className="text-lg font-semibold text-white">{title}</h2><div className="mt-4 space-y-3">{items.length ? items.map((item, index) => <div key={`${item.label}-${index}`} className="flex justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm"><span className="text-slate-200">{item.label}</span><span className="font-semibold text-brand-200">{item.count}</span></div>) : <p className="text-sm text-slate-400">No data available yet.</p>}</div></Card>;
}

export function AdminAnalytics() {
  const { data, loading, error, execute } = useAsync(getAdminAnalytics);
  const analytics = data?.data;
  if (loading && !analytics) return <Loader className="py-20" label="Loading analytics" />;
  if (error) return <ErrorMessage title="Analytics unavailable" message={error.message} actionLabel="Retry" onAction={execute} />;
  return <div className="space-y-6"><PageHeader eyebrow="Platform intelligence" title="Analytics" description="Institution-wide readiness, evidence, roadmap, and catalog signals." /><AnalyticsCards analytics={analytics} /><div className="grid gap-4 xl:grid-cols-3"><Ranking title="Most selected roles" items={analytics?.mostSelectedCareerRoles} /><Ranking title="Most missing skills" items={analytics?.mostMissingSkills} /><Ranking title="Weak evidence skills" items={analytics?.mostCommonWeakEvidenceSkills} /></div></div>;
}
