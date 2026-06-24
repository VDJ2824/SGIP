import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleRequirementList } from './RoleRequirementList';

function sourceLabel(source = '') {
  if (source === 'ai_generated') return 'AI Generated';
  if (source === 'seeded') return 'Seeded';
  return 'Manual';
}

export function RoleDetailModal({ role, isOpen, onClose, onSelect, selecting = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role?.title || 'Role details'}
      description={role?.description || 'Review the role requirements before selecting it for gap analysis.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onSelect?.(role)} isLoading={selecting}>
            Select This Role
          </Button>
        </>
      }
    >
      {role ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{sourceLabel(role.source)}</Badge>
            <Badge tone="neutral">{role.category}</Badge>
            <Badge tone="neutral">{role.experienceLevel}</Badge>
            {role.reviewStatus === 'pending' ? <Badge tone="info">Pending Review</Badge> : null}
          </div>

          <RoleRequirementList title="Required skills" items={role.requiredSkills || []} tone="warning" emptyLabel="No required skills recorded." />
          <RoleRequirementList title="Preferred skills" items={role.preferredSkills || []} tone="info" emptyLabel="No preferred skills recorded." />
          <RoleRequirementList title="Roadmap hints" items={role.roadmapHints || []} tone="neutral" emptyLabel="No roadmap hints available." />

          {role.aliases?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Aliases</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.aliases.map((alias) => (
                  <Badge key={alias} tone="neutral">
                    {alias}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

