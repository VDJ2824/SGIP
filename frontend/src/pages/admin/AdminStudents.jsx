import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StudentTable } from '@/components/admin/StudentTable';
import { AssignMentorModal } from '@/components/admin/AssignMentorModal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { assignStudentMentor, listMentors, listStudents, updateStudentStatus } from '@/services/adminService';

export function AdminStudents() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const studentsRequest = useAsync(() => listStudents({ search, limit: 100 }));
  const mentorsRequest = useAsync(() => listMentors({ limit: 100 }));
  const students = studentsRequest.data?.data || [];
  const mentors = mentorsRequest.data?.data || [];
  const assign = async (mentorId) => {
    setSaving(true);
    try { await assignStudentMentor(selected.id, mentorId); await studentsRequest.execute(); setSelected(null); toast.success('Mentor assigned'); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const toggle = async (student) => {
    try { await updateStudentStatus(student.id, !student.isActive); await studentsRequest.execute(); toast.success('Student status updated'); } catch (err) { toast.error(err.message); }
  };
  if (studentsRequest.loading && !studentsRequest.data) return <Loader className="py-20" label="Loading students" />;
  return <><div className="space-y-6">
    <PageHeader eyebrow="Admin" title="Students" description="View readiness, evidence coverage, mentor assignment, and account status." />
    <form className="max-w-md" onSubmit={(event) => { event.preventDefault(); studentsRequest.execute(); }}><Input label="Search students" leftIcon={Search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></form>
    {studentsRequest.error ? <ErrorMessage title="Students unavailable" message={studentsRequest.error.message} actionLabel="Retry" onAction={studentsRequest.execute} /> : !students.length ? <EmptyState title="No students found" description="Student accounts will appear here after registration." /> : <StudentTable students={students} onAssign={setSelected} onToggle={toggle} />}
  </div><AssignMentorModal student={selected} mentors={mentors} onClose={() => setSelected(null)} onAssign={assign} saving={saving} /></>;
}
