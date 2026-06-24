import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { MentorTable } from '@/components/admin/MentorTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listMentors, updateMentor, updateMentorStatus } from '@/services/adminService';

export function AdminMentors() {
  const { data, loading, error, execute } = useAsync(() => listMentors({ limit: 100 }));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', department: '' });
  const [saving, setSaving] = useState(false);
  const mentors = data?.data || [];
  const toggle = async (mentor) => {
    try { await updateMentorStatus(mentor.id, !mentor.isActive); await execute(); toast.success('Mentor status updated'); } catch (err) { toast.error(err.message); }
  };
  const edit = (mentor) => { setEditing(mentor); setForm({ name: mentor.name, department: mentor.department }); };
  const save = async () => {
    setSaving(true);
    try { await updateMentor(editing.id, form); await execute(); setEditing(null); toast.success('Mentor updated'); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  if (loading && !data) return <Loader className="py-20" label="Loading mentors" />;
  return <><div className="space-y-6">
    <PageHeader eyebrow="Admin" title="Mentors" description="Manage institution-created mentor accounts, assignments, and access." actions={<Button as={Link} to="/admin/mentors/create" icon={UserPlus}>Create mentor</Button>} />
    {error ? <ErrorMessage title="Mentors unavailable" message={error.message} actionLabel="Retry" onAction={execute} /> : !mentors.length ? <EmptyState title="No mentors yet" description="Create the first mentor account to begin assigning students." /> : <MentorTable mentors={mentors} onToggle={toggle} onEdit={edit} />}
  </div>
  <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title="Edit mentor" footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button isLoading={saving} onClick={save}>Save</Button></>}>
    <div className="space-y-4"><Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></div>
  </Modal></>;
}
