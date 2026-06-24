import { Badge } from '@/components/ui/Badge';

export function ExtractedSkillCard({ skill }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{skill.name}</p>
          <p className="mt-1 text-sm text-slate-400">{skill.category}</p>
        </div>
        <Badge tone={skill.confidence >= 0.8 ? 'success' : 'warning'}>{Math.round((skill.confidence || 0) * 100)}%</Badge>
      </div>
      {skill.evidenceText ? <p className="mt-3 text-sm leading-6 text-slate-300">{skill.evidenceText}</p> : null}
    </div>
  );
}
