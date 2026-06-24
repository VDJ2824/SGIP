import { Select } from '@/components/ui/Select';
export function ReportFilters({ value, onChange }) {
  return <Select label="Report category" value={value} onChange={(event)=>onChange(event.target.value)}><option value="">All reports</option><option value="profile">Profile</option><option value="analysis">Analysis</option><option value="progress">Progress</option></Select>;
}
