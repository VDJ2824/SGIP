import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function CareerRoleAdminTable({ roles, onEdit, onArchive }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Role</th><th>Category</th><th>Level</th><th>Source</th><th>Review</th><th>Skills</th><th className="p-4">Actions</th></tr></thead>
        <tbody>{roles.map((role) => <tr key={role.id} className="border-t border-white/10 text-slate-200">
          <td className="p-4 font-medium text-white">{role.title}</td><td>{role.category}</td><td>{role.experienceLevel}</td>
          <td><Badge tone={role.source === 'ai_generated' ? 'warning' : 'info'}>{role.source?.replaceAll('_', ' ')}</Badge></td>
          <td><Badge tone={role.reviewStatus === 'approved' ? 'success' : role.reviewStatus === 'pending' ? 'warning' : 'danger'}>{role.reviewStatus}</Badge></td>
          <td>{role.requiredSkills?.length || 0}</td>
          <td className="p-4"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => onEdit(role)}>Edit</Button><Button size="sm" variant="danger" disabled={!role.isActive} onClick={() => onArchive(role)}>Archive</Button></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
