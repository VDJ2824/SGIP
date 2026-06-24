import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReviewDecisionBadge } from '@/components/mentor/ReviewDecisionBadge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { listMentorReviewHistory } from '@/services/mentorService';
import { formatDateTimeDetailed } from '@/utils/formatters';

export function MentorReviewHistory() {
  const [decision, setDecision] = useState('');
  const request = useAsync(() => listMentorReviewHistory({ decision, limit: 100 }));
  const items = request.data?.data || [];
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading review history" />;
  return <div className="space-y-6"><PageHeader eyebrow="Review trail" title="Review history" description="Your completed evidence decisions for currently assigned students." /><Select className="max-w-xs" label="Decision" value={decision} onChange={(event) => { setDecision(event.target.value); setTimeout(() => request.execute(), 0); }}><option value="">All decisions</option><option value="mentor_approved">Approved</option><option value="changes_requested">Changes requested</option><option value="rejected">Rejected</option></Select>{request.error ? <ErrorMessage title="History unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : items.length ? <div className="overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Reviewed</th><th>Student</th><th>Skill</th><th>Evidence</th><th>Decision</th><th className="p-4">Comment</th></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-t border-white/10 text-slate-200"><td className="p-4">{formatDateTimeDetailed(item.mentorReview.reviewedAt)}</td><td>{item.student?.name}</td><td>{item.skillLabel}</td><td>{item.title}</td><td><ReviewDecisionBadge decision={item.mentorReview.decision} /></td><td className="p-4">{item.mentorReview.comment || 'No comment'}</td></tr>)}</tbody></table></div> : <EmptyState title="No completed reviews" description="Your review decisions will appear here." />}</div>;
}
