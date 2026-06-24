import { Badge } from '@/components/ui/Badge';
import { normalizeRoleLevel, skillLevelLabel } from '@/utils/skillLevel';

export function RoleRequirementList({ title, items = [], tone = 'info', emptyLabel = 'No items yet' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      {!items.length ? <p className="mt-3 text-sm text-slate-400">{emptyLabel}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, index) => {
          const label = typeof item === 'string' ? item : item.name;
          const minimumLevel = typeof item === 'string' ? '' : skillLevelLabel(normalizeRoleLevel(item.minimumLevel, 1));
          const meta = typeof item === 'string' ? '' : [minimumLevel, item.importance].filter(Boolean).join(' • ');
          return (
            <div key={`${label}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge tone={tone}>{label}</Badge>
                {meta ? <span className="text-xs text-slate-500">{meta}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
