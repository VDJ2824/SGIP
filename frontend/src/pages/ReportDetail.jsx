import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportSummary } from '@/components/reports/ReportSummary';
import { ProgressChart } from '@/components/reports/ProgressChart';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { downloadReportPdf, getGapReportHistory, reportLoaders, saveReportBlob } from '@/services/reportService';
import { formatDateTimeDetailed } from '@/utils/formatters';

function label(key) { return key.replace(/([A-Z])/g,' $1').replaceAll('_',' ').replace(/^./,(c)=>c.toUpperCase()); }
function TextList({ items = [], empty = 'None' }) {
  return items.length ? (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
          {item}
        </li>
      ))}
    </ul>
  ) : <p className="text-sm text-slate-400">{empty}</p>;
}

function RoadmapDetails({ report }) {
  const phase = report.currentPhase;
  const task = report.nextRecommendedTask;
  const phaseTasks = phase?.tasks || [];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              {phase ? `Phase ${phase.phaseNumber}` : 'Current phase'}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{phase?.title || 'Roadmap complete'}</h2>
          </div>
          {phase ? <Badge tone={phase.progress === 100 ? 'success' : 'info'}>{phase.progress}% complete</Badge> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {phase?.description || 'There is no active phase remaining.'}
        </p>
        {phase ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-500">Priority</p>
                <p className="mt-1 font-semibold text-white">{phase.priority}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-500">Estimated weeks</p>
                <p className="mt-1 font-semibold text-white">{phase.estimatedWeeks}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-500">Tasks</p>
                <p className="mt-1 font-semibold text-white">{phaseTasks.length}</p>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Phase tasks</h3>
              <TextList items={phaseTasks.map((item) => item.title)} empty="No tasks in this phase." />
            </div>
          </>
        ) : null}
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">Next recommended task</p>
        {task ? (
          <>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">{task.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{task.relatedSkill || 'General readiness'}</p>
              </div>
              <Badge tone={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}>
                {task.priority}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{task.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-500">Estimated duration</p><p className="mt-1 font-semibold text-white">{task.estimatedWeeks} weeks · {task.estimatedHours} hours</p></div>
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-500">Status</p><p className="mt-1 font-semibold capitalize text-white">{task.status?.replaceAll('_', ' ')}</p></div>
            </div>
            <div className="mt-5 space-y-5">
              <div><h3 className="mb-3 text-sm font-semibold text-white">Suggested resources</h3><TextList items={task.suggestedResources} /></div>
              <div><h3 className="mb-3 text-sm font-semibold text-white">Suggested projects</h3><TextList items={task.suggestedProjects} /></div>
              <div><h3 className="mb-3 text-sm font-semibold text-white">Completion criteria</h3><TextList items={task.completionCriteria} /></div>
            </div>
          </>
        ) : <p className="mt-3 text-sm text-slate-400">All roadmap tasks are complete.</p>}
      </Card>
    </div>
  );
}

function Details({ report, excludedKeys = [] }) {
  const entries = Object.entries(report || {}).filter(([key,value]) =>
    !['type','title','generatedAt','available','reportId','roadmapId', ...excludedKeys].includes(key) && value && typeof value === 'object');
  return <div className="grid gap-4 xl:grid-cols-2">{entries.map(([key,value])=><Card key={key}><h2 className="text-lg font-semibold text-white">{label(key)}</h2>{Array.isArray(value) ? <div className="mt-4 space-y-2">{value.length ? value.slice(0,30).map((item,index)=><div key={`${key}-${index}`} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">{typeof item==='object' ? item.name||item.skillName||item.title||item.role||JSON.stringify(item) : String(item)}</div>) : <p className="mt-3 text-sm text-slate-400">No records available.</p>}</div> : <div className="mt-4 space-y-2">{Object.entries(value).map(([child,childValue])=><div key={child} className="flex justify-between gap-4 rounded-2xl bg-white/5 p-3 text-sm"><span className="text-slate-400">{label(child)}</span><span className="text-right text-white">{typeof childValue==='object' ? JSON.stringify(childValue) : String(childValue)}</span></div>)}</div>}</Card>)}</div>;
}

export function ReportDetail() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const loader = reportLoaders[type];
  const request = useAsync(() => loader?.(), Boolean(loader));
  const [history, setHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    if (type === 'gap-analysis') getGapReportHistory().then((result)=>setHistory(result.data||[])).catch(()=>{});
  }, [type]);
  if (!loader) return <EmptyState title="Unknown report" description="This report type is not available." />;
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading report" />;
  if (request.error) return <ErrorMessage title="Report unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} />;
  const report = request.data?.data;
  const download = async () => {
    setDownloading(true);
    try { saveReportBlob(await downloadReportPdf(type),type); toast.success('PDF downloaded'); }
    catch(error){ toast.error(error.message); } finally { setDownloading(false); }
  };
  return <div className="space-y-6"><PageHeader eyebrow="Student report" title={report?.title || 'Report'} description={`Generated from saved platform data · ${formatDateTimeDetailed(report?.generatedAt || new Date())}`} actions={<><Button variant="secondary" icon={Share2} onClick={()=>toast('Sharing will be available in a future release.')}>Share</Button><Button icon={Download} isLoading={downloading} onClick={download}>Download PDF</Button></>} />{report?.available===false ? <EmptyState title="Report data unavailable" description="Complete the related module to populate this report." /> : <><ReportSummary report={report} />{type==='progress' ? <div className="grid gap-4 xl:grid-cols-2"><ProgressChart title="Readiness trend" items={report.readinessScoreTimeline} /><ProgressChart title="Roadmap progress" items={report.roadmapProgressTimeline} /><ProgressChart title="Evidence growth" items={report.evidenceGrowth.map((item)=>({...item,value:Math.min(100,item.value)}))} /><ProgressChart title="Profile completion" items={report.profileCompletionTimeline} /></div> : null}{type === 'roadmap' ? <RoadmapDetails report={report} /> : <Details report={report} />}{type==='gap-analysis' && (searchParams.get('history')==='true'||history.length>1) ? <ReportHistory reports={history} /> : null}</>}</div>;
}
