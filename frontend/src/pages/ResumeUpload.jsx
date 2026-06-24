import { useState } from 'react';
import { AlertTriangle, ArrowRight, BrainCircuit, FileUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { ResumeUploader } from '@/components/resume/ResumeUploader';
import { ResumeTextPreview } from '@/components/resume/ResumeTextPreview';
import { ExtractedSkillCard } from '@/components/resume/ExtractedSkillCard';
import { RedactionSummary } from '@/components/resume/RedactionSummary';
import { extractResumeSkills, uploadResume } from '@/services/resumeService';

export function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadResume(file, (event) => {
        const percent = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
        setUploadProgress(percent);
      });
      setUploadResult(result.data);
      toast.success('Resume uploaded and parsed');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    const resumeId = uploadResult?.id || uploadResult?.resume?._id;
    if (!resumeId) return;
    setError(null);
    setExtracting(true);
    try {
      const result = await extractResumeSkills(resumeId);
      setExtractionResult(result.data);
      toast.success(result.data?.fallbackUsed ? 'Fallback extraction completed' : 'Skills extracted');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Skill extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const resumeId = uploadResult?.id || uploadResult?.resume?._id;
  const skills = extractionResult?.extractedSkills || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resume intelligence"
        title="Upload and parse resume"
        description="Upload a PDF or DOCX resume, extract candidate skills, then review them before they enter your evidence profile."
        actions={
          <Button as={Link} to="/evidence" variant="secondary">
            Skill Evidence
          </Button>
        }
      />

      {error ? <ErrorMessage title="Resume processing failed" message={error.message} icon={AlertTriangle} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Step 1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Upload resume</h2>
            </div>
            <FileUp className="h-6 w-6 text-brand-200" />
          </div>
          <ResumeUploader
            file={file}
            uploadProgress={uploadProgress}
            loading={uploading}
            onFileChange={setFile}
            onUpload={handleUpload}
          />
        </Card>

        <ResumeTextPreview preview={uploadResult?.preview} />
      </div>

      <RedactionSummary summary={uploadResult?.redactionSummary} />

      {uploadResult ? (
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Step 2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Extract candidate skills</h2>
              <p className="mt-2 text-sm text-slate-400">
                Personal information was redacted before AI processing. Please review extracted skills before saving.
              </p>
            </div>
            <Button type="button" icon={BrainCircuit} onClick={handleExtract} isLoading={extracting}>
              Extract skills
            </Button>
          </div>

          {extracting ? <Loader className="mt-6" label="Extracting skills from parsed resume text" /> : null}

          {extractionResult ? (
            <div className="mt-6 space-y-5">
              {extractionResult.fallbackUsed ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  AI was unavailable or returned invalid data, so deterministic fallback extraction was used.
                  {extractionResult.aiMetadata?.failureReason ? ` ${extractionResult.aiMetadata.failureReason}` : ''}
                </div>
              ) : null}
              {!extractionResult.fallbackUsed && extractionResult.aiMetadata?.failureReason ? (
                <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                  Primary AI provider failed, but the extraction recovered using {extractionResult.aiMetadata?.provider}.
                </div>
              ) : null}
              <RedactionSummary summary={extractionResult.redactionSummary || uploadResult.redactionSummary} />
              <div className="flex items-center gap-3">
                <Badge tone="info">{skills.length} skills</Badge>
                <Badge tone={extractionResult.fallbackUsed ? 'warning' : 'success'}>
                  {extractionResult.fallbackUsed ? 'Fallback' : 'AI extraction'}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {skills.map((skill, index) => (
                  <ExtractedSkillCard
                    key={`${skill.normalizedName || skill.name}-${skill.category}-${index}`}
                    skill={skill}
                  />
                ))}
              </div>
              <Button icon={ArrowRight} onClick={() => navigate(`/resumes/${resumeId}/review`)}>
                Review extracted skills
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
