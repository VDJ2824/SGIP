import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { skillLevels } from '@/utils/skillLevel';

const categories = ['Programming', 'Frontend', 'Backend', 'Database', 'Cloud', 'Data/AI', 'Computer Vision', 'Tools', 'Soft Skill', 'Domain Skill', 'Other'];

export function SkillReviewTable({ skills, onChange }) {
  const updateSkill = (index, key, value) => {
    onChange(skills.map((skill, currentIndex) => (currentIndex === index ? { ...skill, [key]: value } : skill)));
  };

  const addSkill = () => {
    onChange([
      ...skills,
      {
        name: '',
        category: 'Other',
        confidence: 0.6,
        level: 1,
        evidenceText: '',
      },
    ]);
  };

  const removeSkill = (index) => {
    onChange(skills.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Reviewed skills</p>
          <p className="mt-1 text-sm text-slate-500">AI extracted skills must be reviewed before use.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addSkill}>
          Add skill
        </Button>
      </div>

      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={`${skill.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr_0.7fr_0.5fr_auto] lg:items-end">
              <Input
                label="Skill name"
                value={skill.name}
                onChange={(event) => updateSkill(index, 'name', event.target.value)}
                placeholder="React"
              />
              <Select label="Category" value={skill.category} onChange={(event) => updateSkill(index, 'category', event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                label="Proficiency"
                value={skill.level}
                onChange={(event) => updateSkill(index, 'level', Number(event.target.value))}
              >
                {skillLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Confidence"
                type="number"
                min="0"
                max="100"
                value={Math.round((Number(skill.confidence) || 0) * 100)}
                onChange={(event) => updateSkill(index, 'confidence', Math.min(1, Math.max(0, Number(event.target.value) / 100)))}
              />
              <Button type="button" variant="danger" icon={Trash2} onClick={() => removeSkill(index)} aria-label="Remove skill">
                Delete
              </Button>
            </div>
            <Textarea
              className="mt-4"
              label="Evidence text"
              rows={3}
              value={skill.evidenceText || ''}
              onChange={(event) => updateSkill(index, 'evidenceText', event.target.value)}
              placeholder="Mention where this skill appears in the resume."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
