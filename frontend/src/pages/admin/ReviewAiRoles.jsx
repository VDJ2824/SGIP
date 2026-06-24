import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { AiRoleReviewCard } from '@/components/admin/AiRoleReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listPendingAiRoles, reviewAiRole } from '@/services/adminService';

export function ReviewAiRoles() {
  const request = useAsync(() => listPendingAiRoles({ limit: 100 }));
  const [saving, setSaving] = useState('');
  const roles = request.data?.data || [];
  const review = async (role, decision) => {
    const comment = window.prompt(`${decision === 'approved' ? 'Approval' : 'Rejection'} comment (optional):`) ?? '';
    setSaving(role.id);
    try { await reviewAiRole(role.id, { decision, comment }); await request.execute(); toast.success(`Role ${decision}`); } catch (err) { toast.error(err.message); } finally { setSaving(''); }
  };
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading AI role queue" />;
  return <div className="space-y-6"><PageHeader eyebrow="Catalog quality" title="AI role review" description="Approve only clean, normalized AI-generated role definitions before they enter the active catalog." />
    {request.error ? <ErrorMessage title="Review queue unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : !roles.length ? <EmptyState title="Review queue is clear" description="No AI-generated career roles are pending." /> : <div className="grid gap-4 xl:grid-cols-2">{roles.map((role) => <AiRoleReviewCard key={role.id} role={role} onReview={review} saving={saving === role.id} />)}</div>}
  </div>;
}
