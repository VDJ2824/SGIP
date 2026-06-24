import { AlertTriangle, FileUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { deleteResume, listResumes } from '@/services/resumeService';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime } from '@/utils/formatters';

export function ResumeList() {
  const { data, loading, error, execute, setData } = useAsync(() => listResumes({ limit: 20 }));
  const resumes = data?.data || [];

  const handleDelete = async (id) => {
    try {
      await deleteResume(id);
      setData((current) => ({
        ...current,
        data: (current?.data || []).filter((resume) => resume._id !== id),
      }));
      toast.success('Resume deleted');
    } catch (err) {
      toast.error(err.message || 'Unable to delete resume');
    }
  };

  if (loading && !data) return <Loader className="py-16" label="Loading resumes" />;
  if (error) return <ErrorMessage title="Resume list unavailable" message={error.message} icon={AlertTriangle} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resume parser"
        title="Uploaded resumes"
        description="Manage parsed resumes and review extracted skills before they enter Skill Evidence."
        actions={
          <Button as={Link} to="/resumes/upload" icon={FileUp}>
            Upload resume
          </Button>
        }
      />

      {!resumes.length ? (
        <EmptyState
          title="No resumes uploaded yet"
          description="Upload a PDF or DOCX resume to extract reviewed skills."
          actionLabel="Upload resume"
          onAction={() => {
            window.location.href = '/resumes/upload';
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {resumes.map((resume) => (
            <Card key={resume._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Resume</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{resume.originalFileName}</h2>
                  <p className="mt-2 text-sm text-slate-500">Uploaded {formatDateTime(resume.createdAt)}</p>
                </div>
                <Badge tone={resume.status === 'reviewed' ? 'success' : 'info'}>{resume.status}</Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button as={Link} to={`/resumes/${resume._id}/review`} variant="secondary">
                  Review
                </Button>
                <Button variant="danger" icon={Trash2} onClick={() => handleDelete(resume._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
