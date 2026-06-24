import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { CareerRoleAdminTable } from '@/components/admin/CareerRoleAdminTable';
import { CareerRoleForm } from '@/components/admin/CareerRoleForm';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { archiveAdminCareerRole, createAdminCareerRole, listAdminCareerRoles, updateAdminCareerRole } from '@/services/adminService';

export function AdminCareerRoles() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const request = useAsync(() => listAdminCareerRoles({ search, limit: 100 }));
  const roles = request.data?.data || [];
  const save = async (payload) => {
    setSaving(true);
    try { editing ? await updateAdminCareerRole(editing.id, payload) : await createAdminCareerRole(payload); await request.execute(); setEditing(undefined); toast.success(editing ? 'Career role updated' : 'Career role created'); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const archive = async (role) => {
    if (!window.confirm(`Archive ${role.title}?`)) return;
    try { await archiveAdminCareerRole(role.id); await request.execute(); toast.success('Career role archived'); } catch (err) { toast.error(err.message); }
  };
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading career roles" />;
  return <><div className="space-y-6"><PageHeader eyebrow="Catalog governance" title="Career roles" description="Create, edit, review, and archive the canonical career role catalog." actions={<Button icon={Plus} onClick={() => setEditing(null)}>Add role</Button>} />
    <form className="max-w-md" onSubmit={(event) => { event.preventDefault(); request.execute(); }}><Input label="Search catalog" leftIcon={Search} value={search} onChange={(event) => setSearch(event.target.value)} /></form>
    {request.error ? <ErrorMessage title="Career roles unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : !roles.length ? <EmptyState title="No career roles found" description="Create a role or adjust the search." /> : <CareerRoleAdminTable roles={roles} onEdit={setEditing} onArchive={archive} />}
  </div><Modal isOpen={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit career role' : 'Create career role'}><CareerRoleForm role={editing} onSubmit={save} onCancel={() => setEditing(undefined)} saving={saving} /></Modal></>;
}
