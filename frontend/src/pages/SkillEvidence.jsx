import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, BadgeCheck, CirclePlus, ExternalLink, Pencil, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { createSkillEvidence, deleteSkillEvidence, listMySkillEvidence } from '@/services/skillEvidenceService';
import { listMySkills, updateSkillLevel } from '@/services/skillService';
import { formatDateTime } from '@/utils/formatters';
import { useAppContext } from '@/context/AppContext';
import { normalizeSkillLevel, skillLevelLabel, skillLevels } from '@/utils/skillLevel';

const evidenceTypes = [
  'resume',
  'certificate',
  'project',
  'internship',
  'assessment',
  'coding_platform',
  'research',
  'competition',
  'manual',
];

const statuses = ['all', 'student_confirmed', 'mentor_approved', 'pending_review', 'needs_evidence'];
const sources = ['all', 'manual', 'resume_parser'];
const trustLevels = ['all', 'low', 'medium', 'high'];

const emptyForm = {
  skillName: '',
  relatedSkills: '',
  category: 'Other',
  level: 2,
  evidenceType: 'manual',
  title: '',
  description: '',
  externalLink: '',
  issuingOrganization: '',
  issueDate: '',
  expiryDate: '',
  projectName: '',
  projectRole: '',
  projectUrl: '',
  internshipCompany: '',
  internshipRole: '',
  internshipDuration: '',
  assessmentName: '',
  assessmentScore: '',
  confidence: '',
  file: null,
};

function toneForStatus(status = '') {
  const tones = {
    mentor_approved: 'success',
    student_confirmed: 'info',
    pending_review: 'warning',
    rejected: 'danger',
    changes_requested: 'info',
    draft: 'neutral',
  };
  return tones[status] || 'neutral';
}

function displayStatus(status = '') {
  if (status === 'student_confirmed') return 'Student Confirmed';
  if (status === 'mentor_approved') return 'Mentor Approved';
  if (status === 'pending_review') return 'Pending Review';
  if (status === 'draft' || status === 'needs_evidence') return 'Needs Evidence';
  return status.replaceAll('_', ' ');
}

function SkillEvidenceSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}

function EvidenceTypeFields({ type, register, errors, setValue }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {type === 'certificate' ? (
        <>
          <Input label="Issuing organization" {...register('issuingOrganization')} error={errors.issuingOrganization?.message} />
          <Input label="Issue date" type="date" {...register('issueDate')} error={errors.issueDate?.message} />
          <Input label="Expiry date" type="date" {...register('expiryDate')} error={errors.expiryDate?.message} />
          <Input label="Certificate link" {...register('externalLink')} error={errors.externalLink?.message} />
        </>
      ) : null}

      {type === 'project' ? (
        <>
          <Input label="Project name" {...register('projectName')} error={errors.projectName?.message} />
          <Input label="Project role" {...register('projectRole')} />
          <Input label="Project URL" {...register('projectUrl')} />
          <Input label="Technologies used" {...register('relatedSkills')} placeholder="React, Node.js, MongoDB" />
        </>
      ) : null}

      {type === 'internship' ? (
        <>
          <Input label="Company" {...register('internshipCompany')} error={errors.internshipCompany?.message} />
          <Input label="Role" {...register('internshipRole')} error={errors.internshipRole?.message} />
          <Input label="Duration" {...register('internshipDuration')} />
          <Input label="Skills used" {...register('relatedSkills')} placeholder="SQL, Python, Dashboarding" />
        </>
      ) : null}

      {type === 'assessment' ? (
        <>
          <Input label="Assessment name" {...register('assessmentName')} error={errors.assessmentName?.message} />
          <Input label="Assessment score" type="number" {...register('assessmentScore')} error={errors.assessmentScore?.message} />
        </>
      ) : null}

      {type === 'coding_platform' ? (
        <>
          <Input label="Platform/profile URL" {...register('externalLink')} />
          <Input label="Rating or solved count" {...register('description')} placeholder="LeetCode 350 solved / Codeforces 1400" />
        </>
      ) : null}

      {type === 'research' || type === 'competition' ? (
        <>
          <Input label="Reference link" {...register('externalLink')} />
          <Input label="Organization" {...register('issuingOrganization')} />
        </>
      ) : null}

      <div className="sm:col-span-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Proof file</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event) => setValue('file', event.target.files?.[0] || null)}
            className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-100"
          />
        </label>
      </div>
    </div>
  );
}

export function SkillEvidence() {
  const { runWithLoading } = useAppContext();
  const { data, loading, error, execute } = useAsync(() => listMySkillEvidence({ limit: 100 }));
  const { data: skillsResponse, execute: reloadSkills } = useAsync(() => listMySkills(), true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [trustFilter, setTrustFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editedLevel, setEditedLevel] = useState(2);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyForm });

  const groups = data?.data || [];
  const skills = skillsResponse?.data || [];
  const evidenceType = watch('evidenceType');

  const skillCards = useMemo(() => {
    const groupsBySkillId = new Map(groups.map((group) => [String(group.skillId), group]));
    return skills.map((skill) => {
      const group = groupsBySkillId.get(String(skill._id));
      return {
        skillId: String(skill._id),
        skillLabel: skill.name,
        category: skill.category,
        level: normalizeSkillLevel(skill.level, 2),
        levelLabel: skill.levelLabel || skillLevelLabel(skill.level),
        source: ['resume', 'resume_parser'].includes(skill.source) ? 'resume_parser' : skill.source || 'manual',
        reviewState: skill.reviewState || group?.reviewState || 'student_confirmed',
        trustLevel: skill.trustLevel || group?.trustLevel || 'medium',
        evidence: group?.evidence || skill.evidence || [],
        evidenceCount: skill.evidenceCount ?? group?.evidence?.length ?? 0,
        evidenceSummary: skill.evidenceSummary || group?.evidenceSummary || {},
      };
    });
  }, [groups, skills]);

  const filteredGroups = useMemo(
    () =>
      skillCards.filter((group) => {
        const matchesQuery =
          !query.trim() ||
          [group.skillLabel, group.category]
            .some((value) => String(value || '').toLowerCase().includes(query.toLowerCase()));
        const effectiveStatus = group.evidenceCount ? group.reviewState : 'needs_evidence';
        const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
        const matchesLevel = levelFilter === 'all' || group.level === Number(levelFilter);
        const matchesSource = sourceFilter === 'all' || group.source === sourceFilter;
        const matchesTrust = trustFilter === 'all' || group.trustLevel === trustFilter;
        return matchesQuery && matchesStatus && matchesLevel && matchesSource && matchesTrust;
      }),
    [skillCards, query, statusFilter, levelFilter, sourceFilter, trustFilter],
  );

  const closeModal = () => {
    setIsOpen(false);
    reset(emptyForm);
  };

  const openEvidenceModal = (skill = null) => {
    reset({
      ...emptyForm,
      skillName: skill?.skillLabel || '',
      category: skill?.category || 'Other',
      level: skill?.level || 2,
    });
    setIsOpen(true);
  };

  const onSubmit = async (values) => {
    await runWithLoading(
      async () => {
        await createSkillEvidence({
          ...values,
          assessmentScore: values.assessmentScore ? Number(values.assessmentScore) : undefined,
          confidence: values.confidence ? Number(values.confidence) : undefined,
        });
        await execute();
        await reloadSkills();
        toast.success('Evidence submitted for mentor review');
      },
      { errorMessage: 'Unable to submit evidence' },
    );

    closeModal();
  };

  const openLevelEditor = (skill) => {
    setEditingSkill(skill);
    setEditedLevel(skill.level);
  };

  const saveLevel = async () => {
    if (!editingSkill) return;
    await runWithLoading(
      async () => {
        await updateSkillLevel(editingSkill.skillId, editedLevel);
        await reloadSkills();
        toast.success(`${editingSkill.skillLabel} level updated`);
      },
      { errorMessage: 'Unable to update proficiency level' },
    );
    setEditingSkill(null);
  };

  const handleDelete = async (evidenceId) => {
    await runWithLoading(
      async () => {
        await deleteSkillEvidence(evidenceId);
        await execute();
        await reloadSkills();
        toast.success('Evidence deleted');
      },
      { errorMessage: 'Unable to delete evidence' },
    );
  };

  if (loading && !data) return <SkillEvidenceSkeleton />;
  if (error) return <ErrorMessage title="Skill evidence could not load" message={error.message} icon={AlertCircle} />;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Evidence vault"
          title="Skill evidence"
          description="Submit proof for your skills and track mentor verification status."
          actions={
            <Button icon={CirclePlus} onClick={() => openEvidenceModal()}>
              Add evidence
            </Button>
          }
        />

        <Card>
          <div className="grid gap-4 lg:grid-cols-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Search skills</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search skill label or category"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </label>
            <Select label="Level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              <option value="all">All levels</option>
              {skillLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </Select>
            <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All statuses' : displayStatus(status)}
                </option>
              ))}
            </Select>
            <Select label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source === 'all' ? 'All sources' : source === 'resume_parser' ? 'Resume parser' : 'Manual'}
                </option>
              ))}
            </Select>
            <Select label="Trust" value={trustFilter} onChange={(event) => setTrustFilter(event.target.value)}>
              {trustLevels.map((trust) => (
                <option key={trust} value={trust}>
                  {trust === 'all' ? 'All trust levels' : `${trust} trust`}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {!filteredGroups.length ? (
          <EmptyState
            title="No skill evidence yet"
            description="Add a new skill manually or submit proof for an extracted resume skill."
            actionLabel="Add evidence"
            onAction={() => openEvidenceModal()}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card key={group.skillId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{group.category || 'Skill'}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{group.skillLabel}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={group.level === 3 ? 'success' : group.level === 2 ? 'info' : 'neutral'}>
                        {group.levelLabel}
                      </Badge>
                      <Badge tone="neutral">{group.evidenceCount} evidence item(s)</Badge>
                      <Badge tone={group.trustLevel === 'high' ? 'success' : group.trustLevel === 'medium' ? 'info' : 'warning'}>
                        {group.trustLevel} trust
                      </Badge>
                    </div>
                  </div>
                  <Badge tone={toneForStatus(group.evidenceCount ? group.reviewState : 'draft')}>
                    {displayStatus(group.evidenceCount ? group.reviewState : 'needs_evidence')}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  Best evidence: {group.evidenceSummary?.bestEvidenceType
                    ? group.evidenceSummary.bestEvidenceType.replaceAll('_', ' ')
                    : 'None'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" icon={Pencil} onClick={() => openLevelEditor(group)}>
                    Edit level
                  </Button>
                  <Button type="button" variant="ghost" size="sm" icon={CirclePlus} onClick={() => openEvidenceModal(group)}>
                    Add evidence
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {group.evidence.slice(0, 3).map((item) => (
                    <div key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                            {item.evidenceType.replaceAll('_', ' ')}
                          </p>
                        </div>
                        <Badge tone={toneForStatus(item.reviewState)}>{displayStatus(item.reviewState)}</Badge>
                      </div>
                      {item.description ? <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p> : null}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>Submitted {formatDateTime(item.submittedAt || item.createdAt)}</span>
                        {item.externalLink ? (
                          <a href={item.externalLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-200">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Link
                          </a>
                        ) : null}
                      </div>
                      {item.mentorReview?.comment ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
                          Mentor comment: {item.mentorReview.comment}
                        </div>
                      ) : null}
                      {item.evidenceType !== 'resume' ? (
                        <div className="mt-3">
                          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item._id)}>
                            Remove
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Add skill evidence"
        description="Manual skills are student confirmed immediately. Certificates, projects, and other proof enter mentor review."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="skill-evidence-form" isLoading={isSubmitting} icon={BadgeCheck}>
              Submit evidence
            </Button>
          </>
        }
      >
        <form id="skill-evidence-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Skill name"
            list="my-skill-options"
            {...register('skillName', { required: 'Skill name is required' })}
            error={errors.skillName?.message}
          />
          <datalist id="my-skill-options">
            {skills.map((skill) => (
              <option key={skill._id} value={skill.name} />
            ))}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Category" {...register('category', { required: 'Category is required' })} error={errors.category?.message} />
            <Select label="Proficiency level" {...register('level', { valueAsNumber: true, required: true })}>
              {skillLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Evidence type" {...register('evidenceType')}>
              {evidenceTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
            <Input label="Title" {...register('title', { required: 'Title is required' })} error={errors.title?.message} />
          </div>

          <Textarea label="Description" rows={4} {...register('description')} />
          <Input label="Additional related skills" {...register('relatedSkills')} placeholder="Optional: React, TypeScript, API design" />
          <Input label="External link" {...register('externalLink')} />

          <EvidenceTypeFields type={evidenceType} register={register} errors={errors} setValue={setValue} />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        title={`Edit ${editingSkill?.skillLabel || 'skill'} level`}
        description="Choose the proficiency level used by gap analysis."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSkill(null)}>Cancel</Button>
            <Button onClick={saveLevel}>Save level</Button>
          </>
        }
      >
        <Select label="Proficiency level" value={editedLevel} onChange={(event) => setEditedLevel(Number(event.target.value))}>
          {skillLevels.map((level) => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </Select>
      </Modal>
    </>
  );
}
