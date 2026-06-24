import { Badge } from '@/components/ui/Badge';

export function ReviewDecisionBadge({ decision = 'pending_review' }) {
  const tone = decision === 'mentor_approved' || decision === 'approved' ? 'success' : decision === 'rejected' ? 'danger' : decision === 'changes_requested' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{decision.replaceAll('_', ' ')}</Badge>;
}
