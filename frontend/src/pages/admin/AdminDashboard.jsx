import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { ActivityLogTable } from '@/components/admin/ActivityLogTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getAdminDashboard } from '@/services/adminService';

export function AdminDashboard() {
  const { data, loading, error, execute } = useAsync(getAdminDashboard);
  const dashboard = data?.data;
  if (loading && !dashboard) return <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>;
  if (error) return <ErrorMessage title="Admin dashboard unavailable" message={error.message} actionLabel="Retry" onAction={execute} />;
  return <div className="space-y-6">
    <PageHeader eyebrow="Institution administration" title="Admin dashboard" description="Manage people, catalog quality, reviews, and platform readiness from one workspace." actions={<Button variant="secondary" icon={RefreshCw} onClick={execute} isLoading={loading}>Refresh</Button>} />
    <AdminStatsCards stats={dashboard} />
    <div className="grid gap-4 md:grid-cols-3">
      {[['Create mentor', '/admin/mentors/create'], ['Assign students', '/admin/students'], ['Review AI roles', '/admin/career-roles/review']].map(([label, to]) => <Card key={to}><h2 className="text-lg font-semibold text-white">{label}</h2><Button as={Link} to={to} variant="secondary" icon={ArrowRight} className="mt-4">Open</Button></Card>)}
    </div>
    <section><h2 className="mb-4 text-xl font-semibold text-white">Recent activity</h2>{dashboard?.recentActivity?.length ? <ActivityLogTable items={dashboard.recentActivity} /> : <Card><p className="text-slate-400">No administrative activity has been recorded yet.</p></Card>}</section>
  </div>;
}
