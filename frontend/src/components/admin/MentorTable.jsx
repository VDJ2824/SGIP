import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function MentorTable({ mentors, onToggle, onEdit }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Mentor</th><th>Department</th><th>Students</th><th>Status</th><th className="p-4">Actions</th></tr></thead>
        <tbody>
          {mentors.map((mentor) => (
            <tr key={mentor.id} className="border-t border-white/10 text-slate-200">
              <td className="p-4"><p className="font-medium text-white">{mentor.name}</p><p className="text-slate-400">{mentor.email}</p></td>
              <td>{mentor.department || 'Not set'}</td>
              <td>{mentor.assignedStudentsCount || 0}</td>
              <td><Badge tone={mentor.isActive ? 'success' : 'danger'}>{mentor.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="p-4"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => onEdit(mentor)}>Edit</Button><Button size="sm" variant={mentor.isActive ? 'danger' : 'secondary'} onClick={() => onToggle(mentor)}>{mentor.isActive ? 'Deactivate' : 'Activate'}</Button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
