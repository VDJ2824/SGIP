import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { PendingEvidenceTable } from '@/components/mentor/PendingEvidenceTable';
import { EvidenceReviewModal } from '@/components/mentor/EvidenceReviewModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listMentorPendingEvidence, reviewMentorEvidence } from '@/services/mentorService';

export function MentorEvidenceReview() {
  const request = useAsync(() => listMentorPendingEvidence({ limit: 100 }));
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const items = request.data?.data || [];
  const submit = async (payload) => {
    setSaving(true);
    try { await reviewMentorEvidence(selected._id, payload); await request.execute(); setSelected(null); toast.success('Evidence review saved'); } catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading evidence queue" />;
  return <><div className="space-y-6"><PageHeader eyebrow="Mentor review queue" title="Pending evidence" description="Only review-required evidence from students assigned to you appears here." />{request.error ? <ErrorMessage title="Evidence queue unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : items.length ? <PendingEvidenceTable items={items} onReview={setSelected} /> : <EmptyState title="Review queue is clear" description="Resume and manual student-confirmed evidence never enters this queue." />}</div><EvidenceReviewModal evidence={selected} saving={saving} onClose={() => setSelected(null)} onSubmit={submit} /></>;
}
