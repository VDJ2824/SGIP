import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ActivityLogTable } from '@/components/admin/ActivityLogTable';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listAdminActivity } from '@/services/adminService';

export function AdminActivityLog() {
  const [actorRole, setActorRole] = useState('');
  const request = useAsync(() => listAdminActivity({ actorRole, limit: 100 }));
  const items = request.data?.data || [];
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading activity" />;
  return <div className="space-y-6"><PageHeader eyebrow="Governance" title="Activity log" description="A traceable record of important administrative and review actions." />
    <Select className="max-w-xs" label="Actor role" value={actorRole} onChange={(event) => { setActorRole(event.target.value); setTimeout(() => request.execute(), 0); }}><option value="">All roles</option><option value="admin">Admin</option><option value="mentor">Mentor</option><option value="student">Student</option><option value="system">System</option></Select>
    {request.error ? <ErrorMessage title="Activity unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : !items.length ? <EmptyState title="No activity recorded" description="Important actions will appear here." /> : <ActivityLogTable items={items} />}
  </div>;
}
