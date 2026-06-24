import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export function AssignMentorModal({ student, mentors, onClose, onAssign, saving }) {
  const [mentorId, setMentorId] = useState('');
  useEffect(() => setMentorId(student?.assignedMentor?.id || ''), [student]);
  return (
    <Modal
      isOpen={Boolean(student)}
      onClose={onClose}
      title="Assign mentor"
      description={student ? `Choose an active mentor for ${student.name}.` : ''}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!mentorId} isLoading={saving} onClick={() => onAssign(mentorId)}>Save assignment</Button></>}
    >
      <Select label="Mentor" value={mentorId} onChange={(event) => setMentorId(event.target.value)}>
        <option value="">Select a mentor</option>
        {mentors.filter((mentor) => mentor.isActive).map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name} - {mentor.department}</option>)}
      </Select>
    </Modal>
  );
}
