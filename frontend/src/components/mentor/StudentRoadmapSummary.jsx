import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function StudentRoadmapSummary({ studentId, roadmap }) {
  return <Card><p className="text-sm text-slate-400">Learning roadmap</p>{roadmap ? <><h2 className="mt-3 text-xl font-semibold text-white">{roadmap.targetRole}</h2><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-brand-500" style={{ width: `${roadmap.overallProgress}%` }} /></div><p className="mt-2 text-sm text-slate-400">{roadmap.overallProgress}% complete · {roadmap.pendingTasks} tasks remaining</p><Button as={Link} to={`/mentor/students/${studentId}/roadmap`} variant="secondary" className="mt-5">View roadmap</Button></> : <p className="mt-3 text-sm text-slate-400">No roadmap generated yet.</p>}</Card>;
}
