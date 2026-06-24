import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function RedactionSummary({ summary }) {
  if (!summary) return null;

  const items = [
    ['Emails removed', summary.emailsRemoved || 0],
    ['Phones removed', summary.phonesRemoved || 0],
    ['Links removed', summary.linksRemoved || 0],
    ['Header lines redacted', summary.headerLinesRemoved || 0],
    ['Name redacted', summary.nameRedacted ? 'Yes' : 'No'],
  ];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-white">Redaction summary</p>
          <p className="mt-1 text-sm text-slate-400">Personal information was redacted before AI processing.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map(([label, value]) => (
          <Badge key={label} tone="info">
            {label}: {value}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
