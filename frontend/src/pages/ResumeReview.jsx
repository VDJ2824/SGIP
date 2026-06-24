import { useEffect, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { SkillReviewTable } from '@/components/resume/SkillReviewTable';
import { extractResumeSkills, getResume, reviewResumeSkills } from '@/services/resumeService';
import { useAsync } from '@/hooks/useAsync';
import { normalizeSkillLevel, suggestedResumeSkillLevel } from '@/utils/skillLevel';

const allowedCategories = new Set(['Programming', 'Frontend', 'Backend', 'Database', 'Cloud', 'Data/AI', 'Computer Vision', 'Tools', 'Soft Skill', 'Domain Skill', 'Other']);

function normalizeReviewSkill(skill) {
  return {
    name: skill.name,
    category: allowedCategories.has(skill.category) ? skill.category : 'Other',
    confidence: Number(skill.confidence || 0),
    level: normalizeSkillLevel(skill.level, suggestedResumeSkillLevel(skill.confidence)),
    evidenceText: skill.evidenceText || '',
  };
}

export function ResumeReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const { data, loading, error, execute, setData } = useAsync(() => getResume(id), Boolean(id));
  const resume = data?.data || null;

  useEffect(() => {
    if (resume?.extractedSkills?.length) {
      setSkills(resume.extractedSkills.map(normalizeReviewSkill));
      setFallbackUsed(Boolean(resume.aiMetadata?.fallbackUsed));
    }
  }, [resume]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const result = await extractResumeSkills(id);
      setData({ data: result.data.resume });
      setSkills((result.data.extractedSkills || []).map(normalizeReviewSkill));
      setFallbackUsed(Boolean(result.data.fallbackUsed));
      toast.success(result.data.fallbackUsed ? 'Fallback extraction completed' : 'Skills extracted');
    } catch (err) {
      toast.error(err.message || 'Unable to extract skills');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    const reviewed = skills.filter((skill) => skill.name.trim() && skill.category.trim());
    if (!reviewed.length) {
      toast.error('Add at least one reviewed skill');
      return;
    }

    setSaving(true);
    try {
      const result = await reviewResumeSkills(id, reviewed);
      toast.success(`${result.data.evidenceRecords?.length || reviewed.length} reviewed skills saved to Skill Evidence`);
      navigate('/evidence', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to save reviewed skills');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !resume) {
    return <Loader className="py-16" label="Loading resume review" />;
  }

  if (error) {
    return <ErrorMessage title="Resume not available" message={error.message} icon={AlertTriangle} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resume review"
        title="Review extracted skills"
        description="Edit, remove, or add skills before saving them into Skill Evidence."
        actions={
          <>
            <Button as={Link} to="/resumes/upload" variant="secondary">
              Upload another
            </Button>
            <Button as={Link} to="/gaps" variant="secondary">
              Gap Analysis
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Resume</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{resume?.originalFileName || 'Resume'}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={resume?.status === 'reviewed' ? 'success' : 'info'}>{resume?.status || 'uploaded'}</Badge>
              {fallbackUsed ? <Badge tone="warning">Fallback extraction</Badge> : null}
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={handleExtract} isLoading={extracting}>
            Re-extract skills
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Personal information was redacted before AI processing. Please review extracted skills before saving.
        </div>
        <SkillReviewTable skills={skills} onChange={setSkills} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" icon={Save} onClick={handleSave} isLoading={saving}>
            Save reviewed skills
          </Button>
          <Button type="button" variant="ghost" onClick={() => execute()}>
            Reset from resume
          </Button>
        </div>
      </Card>
    </div>
  );
}
