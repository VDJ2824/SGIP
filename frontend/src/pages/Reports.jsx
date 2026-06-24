import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportCard } from '@/components/reports/ReportCard';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { downloadReportPdf, getReports, saveReportBlob } from '@/services/reportService';

const groups = {
  'profile-summary': 'profile', 'resume-analysis': 'analysis', 'gap-analysis': 'analysis',
  roadmap: 'progress', 'skill-evidence': 'analysis', progress: 'progress',
};

export function Reports() {
  const request = useAsync(getReports);
  const [filter, setFilter] = useState('');
  const [downloading, setDownloading] = useState('');
  const reports = (request.data?.data || []).filter((report) => !filter || groups[report.type] === filter);
  const download = async (type) => {
    setDownloading(type);
    try { saveReportBlob(await downloadReportPdf(type), type); toast.success('Report PDF downloaded'); }
    catch (error) { toast.error(error.message || 'Unable to download report'); }
    finally { setDownloading(''); }
  };
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading reports center" />;
  if (request.error) return <ErrorMessage title="Reports unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} />;
  return <div className="space-y-6"><PageHeader eyebrow="Student reports center" title="Reports" description="Live reports assembled from your saved profile, resume, evidence, gap analyses, and roadmap. No AI or scoring is rerun." /><div className="max-w-xs"><ReportFilters value={filter} onChange={setFilter} /></div>{reports.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map((report,index)=><ReportCard key={report.type} report={report} index={index} downloading={downloading===report.type} onDownload={download} />)}</div> : <EmptyState title="No reports match this filter" description="Choose another report category." />}</div>;
}
