import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { compareGapReports } from '@/services/reportService';
import { formatDateTimeDetailed } from '@/utils/formatters';

export function ReportHistory({ reports = [] }) {
  const [previous, setPrevious] = useState('');
  const [current, setCurrent] = useState('');
  const [comparison, setComparison] = useState(null);
  const compare = async () => {
    try { const result = await compareGapReports(previous,current); setComparison(result.data); } catch (error) { toast.error(error.message); }
  };
  return <Card><h2 className="text-xl font-semibold text-white">Compare gap analyses</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><Select label="Previous report" value={previous} onChange={(e)=>setPrevious(e.target.value)}><option value="">Select</option>{reports.map((item)=><option key={item.reportId} value={item.reportId}>{item.targetRole} · {formatDateTimeDetailed(item.generatedAt)}</option>)}</Select><Select label="Current report" value={current} onChange={(e)=>setCurrent(e.target.value)}><option value="">Select</option>{reports.map((item)=><option key={item.reportId} value={item.reportId}>{item.targetRole} · {formatDateTimeDetailed(item.generatedAt)}</option>)}</Select></div><Button className="mt-4" disabled={!previous||!current||previous===current} onClick={compare}>Compare</Button>{comparison ? <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-4"><p className="text-slate-400">Previous</p><p className="text-2xl font-semibold text-white">{comparison.previousReadiness}%</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-slate-400">Current</p><p className="text-2xl font-semibold text-white">{comparison.currentReadiness}%</p></div><div className="rounded-2xl bg-brand-500/15 p-4"><p className="text-slate-400">Difference</p><p className="text-2xl font-semibold text-brand-200">{comparison.difference>0?'+':''}{comparison.difference}%</p></div></div> : null}</Card>;
}
