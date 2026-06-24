import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function StudentTable({ students, onAssign, onToggle }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Student</th><th>Profile</th><th>Mentor</th><th>Readiness</th><th>Evidence</th><th>Status</th><th className="p-4">Actions</th></tr></thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-t border-white/10 text-slate-200">
              <td className="p-4"><p className="font-medium text-white">{student.name}</p><p className="text-slate-400">{student.email}</p></td>
              <td>{student.profileCompletion}%</td>
              <td>{student.assignedMentor?.name || 'Unassigned'}</td>
              <td>{student.latestReadinessScore}%</td>
              <td>{student.evidenceCounts?.approved || 0} approved / {student.evidenceCounts?.total || 0}</td>
              <td><Badge tone={student.isActive ? 'success' : 'danger'}>{student.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="p-4"><div className="flex gap-2"><Button size="sm" onClick={() => onAssign(student)}>Assign</Button><Button size="sm" variant={student.isActive ? 'danger' : 'secondary'} onClick={() => onToggle(student)}>{student.isActive ? 'Deactivate' : 'Activate'}</Button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
