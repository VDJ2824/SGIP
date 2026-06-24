import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTimeDetailed } from '@/utils/formatters';

export function PendingEvidenceTable({ items, onReview }) {
  return <div className="overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[980px] text-left text-sm">
    <thead className="bg-white/5 text-slate-400"><tr><th className="p-4">Student</th><th>Skill</th><th>Evidence</th><th>Submitted</th><th>Proof</th><th className="p-4">Review</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item._id} className="border-t border-white/10 text-slate-200">
      <td className="p-4"><p className="font-medium text-white">{item.student?.name || 'Assigned student'}</p><p className="text-slate-400">{item.student?.email}</p></td>
      <td><p className="font-medium text-white">{item.skillLabel}</p><Badge tone="warning">{item.evidenceType.replaceAll('_', ' ')}</Badge></td>
      <td><p>{item.title}</p><p className="max-w-xs truncate text-slate-400">{item.description}</p></td>
      <td>{formatDateTimeDetailed(item.submittedAt || item.createdAt)}</td>
      <td>{item.fileUrl || item.externalLink ? <a className="inline-flex items-center gap-1 text-brand-200 hover:underline" href={item.fileUrl || item.externalLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a> : 'No link'}</td>
      <td className="p-4"><Button size="sm" onClick={() => onReview(item)}>Review</Button></td>
    </tr>)}</tbody>
  </table></div>;
}
