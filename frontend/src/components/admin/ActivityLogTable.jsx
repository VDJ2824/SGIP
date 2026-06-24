import { formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';

export function ActivityLogTable({ items }) {
  return <div className="overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[760px] text-left text-sm">
    <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">When</th><th>Actor</th><th>Action</th><th>Activity</th><th>Target</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item._id} className="border-t border-white/10 text-slate-200"><td className="p-4">{formatDateTime(item.createdAt)}</td><td>{item.actorId?.name || 'System'}<p className="text-xs text-slate-400">{item.actorId?.email || ''}</p></td><td><Badge>{item.action.replaceAll('_', ' ')}</Badge></td><td>{item.message}</td><td>{item.targetType}</td></tr>)}</tbody>
  </table></div>;
}
