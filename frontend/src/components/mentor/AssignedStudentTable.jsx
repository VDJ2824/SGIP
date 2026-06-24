import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function AssignedStudentTable({ students }) {
  return <div className="overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[850px] text-left text-sm">
    <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Student</th><th>Profile</th><th>Skills</th><th>Pending evidence</th><th>Readiness</th><th>Roadmap</th><th className="p-4">Action</th></tr></thead>
    <tbody>{students.map((student) => <tr key={student.id} className="border-t border-white/10 text-slate-200">
      <td className="p-4"><p className="font-medium text-white">{student.name}</p><p className="text-slate-400">{student.email}</p></td>
      <td>{student.profileCompletion}%</td><td>{student.approvedSkills}/{student.totalSkills} approved</td>
      <td><Badge tone={student.pendingEvidenceCount ? 'warning' : 'success'}>{student.pendingEvidenceCount}</Badge></td>
      <td>{student.latestReadinessScore}%</td><td>{student.latestRoadmapProgress}%</td>
      <td className="p-4"><Button as={Link} to={`/mentor/students/${student.id}`} size="sm">View student</Button></td>
    </tr>)}</tbody>
  </table></div>;
}
