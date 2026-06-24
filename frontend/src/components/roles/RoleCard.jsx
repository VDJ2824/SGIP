import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, Sparkles } from 'lucide-react';

function sourceLabel(source = '') {
  if (source === 'ai_generated') return 'AI Generated';
  if (source === 'seeded') return 'Seeded';
  return 'Manual';
}

export function RoleCard({ role, selected = false, onSelect, onPreview, index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card
        className={`flex h-full flex-col transition-all ${selected ? 'ring-2 ring-brand-400' : ''}`}
        onClick={() => onSelect?.(role)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect?.(role);
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-200">{role.category}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{role.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={role.source === 'ai_generated' ? 'warning' : 'success'}>{sourceLabel(role.source)}</Badge>
            {role.reviewStatus === 'pending' ? <Badge tone="info">Pending Review</Badge> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="neutral">{role.experienceLevel}</Badge>
          <Badge tone="neutral">{role.requiredSkills?.length || 0} required</Badge>
          <Badge tone="neutral">{role.preferredSkills?.length || 0} preferred</Badge>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">{role.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(role.requiredSkills || []).slice(0, 4).map((skill) => (
            <Badge key={skill.name} tone="info">
              {skill.name}
            </Badge>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="ghost" icon={Eye} onClick={(event) => {
            event.stopPropagation();
            onPreview?.(role);
          }}>
            View details
          </Button>
          {role.source === 'ai_generated' ? (
            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-brand-200" />
              Stored for future searches
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

