import { Link } from 'react-router-dom';
import { Download, FileText, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ReportCard({ report, index, downloading, onDownload }) {
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
    <Card className="h-full">
      <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-200 w-fit"><FileText className="h-5 w-5" /></div>
      <h2 className="mt-5 text-xl font-semibold text-white">{report.title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{report.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button as={Link} to={`/reports/${report.type}`} size="sm">View</Button>
        <Button size="sm" variant="secondary" icon={Download} isLoading={downloading} onClick={() => onDownload(report.type)}>PDF</Button>
        {report.type === 'gap-analysis' ? <Button as={Link} to="/reports/gap-analysis?history=true" size="sm" variant="ghost" icon={History}>History</Button> : null}
      </div>
    </Card>
  </motion.div>;
}
