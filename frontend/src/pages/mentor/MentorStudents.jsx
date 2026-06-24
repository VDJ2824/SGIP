import { PageHeader } from '@/components/common/PageHeader';
import { AssignedStudentTable } from '@/components/mentor/AssignedStudentTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listMentorStudents } from '@/services/mentorService';

export function MentorStudents() {
  const { data, loading, error, execute } = useAsync(() => listMentorStudents({ limit: 100 }));
  const students = data?.data || [];
  if (loading && !data) return <Loader className="py-20" label="Loading assigned students" />;
  return <div className="space-y-6"><PageHeader eyebrow="Mentor portfolio" title="Assigned students" description="Read-only readiness, skills, evidence, and roadmap progress for students assigned to you." />{error ? <ErrorMessage title="Students unavailable" message={error.message} actionLabel="Retry" onAction={execute} /> : students.length ? <AssignedStudentTable students={students} /> : <EmptyState title="No assigned students" description="An administrator must assign students to your mentor account." />}</div>;
}
