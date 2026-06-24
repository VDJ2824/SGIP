import { Card } from '@/components/ui/Card';

export function ResumeTextPreview({ preview }) {
  if (!preview) return null;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">Redacted parsed text preview</p>
        <p className="text-xs text-slate-500">Scroll to inspect the full parsed text</p>
      </div>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
        {preview}
      </pre>
    </Card>
  );
}
