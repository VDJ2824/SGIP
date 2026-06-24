import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export function EvidenceReviewModal({ evidence, saving, onClose, onSubmit }) {
  const [decision, setDecision] = useState('mentor_approved');
  const [comment, setComment] = useState('');
  useEffect(() => { setDecision('mentor_approved'); setComment(''); }, [evidence]);
  const requiresComment = decision !== 'mentor_approved';
  return <Modal isOpen={Boolean(evidence)} onClose={onClose} title={`Review ${evidence?.skillLabel || 'evidence'}`} description={evidence ? `${evidence.student?.name || 'Student'} submitted ${evidence.title}.` : ''} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={requiresComment && !comment.trim()} isLoading={saving} onClick={() => onSubmit({ decision, comment })}>Submit decision</Button></>}>
    <div className="space-y-4"><Select label="Decision" value={decision} onChange={(event) => setDecision(event.target.value)}><option value="mentor_approved">Approve</option><option value="changes_requested">Request changes</option><option value="rejected">Reject</option></Select><Textarea label={`Review comment${requiresComment ? ' (required)' : ' (optional)'}`} rows={5} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Explain the decision or what the student should improve." /></div>
  </Modal>;
}
