import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Building2,
  Mail,
  Trash2,
  UserCircle2,
  UserRoundCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Loader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/hooks/useAsync';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { createProfile, deleteProfile, getProfile, updateMyProfile } from '@/services/profileService';
import { getStudentId } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';
import { listMySkills } from '@/services/skillService';
import { skillLevelLabel } from '@/utils/skillLevel';

function skillStatus(skill) {
  if (skill.reviewState === 'mentor_approved') return { label: 'Mentor Approved', tone: 'success' };
  if (skill.reviewState === 'student_confirmed') return { label: 'Student Confirmed', tone: 'info' };
  if (skill.reviewState === 'pending_review') return { label: 'Pending Review', tone: 'warning' };
  return { label: 'Needs Evidence', tone: 'neutral' };
}

function skillEvidenceLabel(skill) {
  const type = skill.evidenceSummary?.bestEvidenceType;
  if (type === 'resume') return 'Resume Parsed';
  if (type === 'manual') return 'Manual';
  return type ? type.replaceAll('_', ' ') : 'None';
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-[40rem]" />
      <Skeleton className="h-[40rem]" />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
    </div>
  );
}

function blankFormValues() {
  return {
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      bio: '',
    },
    education: {
      institution: '',
      degree: '',
      semester: '',
      cgpa: '',
      graduationYear: '',
    },
  };
}

export function StudentProfile() {
  const { runWithLoading } = useAppContext();
  const { user } = useAuth();
  const { data: profileResponse, loading, error, execute, setData } = useAsync(async () => {
    try {
      return await getProfile();
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  });
  const profile = profileResponse?.data || null;
  const { data: skillsResponse } = useAsync(() => listMySkills(), true);
  const profileSkills = (skillsResponse?.data || []).slice(0, 8);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: blankFormValues() });

  useEffect(() => {
    if (profile) {
      reset({
        personal: profile.personal || blankFormValues().personal,
        education: profile.education || blankFormValues().education,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values) => {
    const studentId = user?._id || getStudentId();
    if (!studentId) {
      throw new Error('Unable to determine your account id. Please sign in again.');
    }
    const payload = {
      studentId,
      personal: {
        ...(profile?.personal || {}),
        ...values.personal,
      },
      education: values.education,
      experience: profile?.experience || [],
      certifications: profile?.certifications || [],
      topSkills: profile?.topSkills || [],
      strengths: profile?.strengths || [],
      improvementAreas: profile?.improvementAreas || [],
      overallReadiness: profile?.overallReadiness || 0,
      resume: profile?.resume || {},
    };

    const result = await runWithLoading(
      () => {
        if (profile?._id) {
          return updateMyProfile(payload);
        }
        return createProfile(payload);
      },
      { successMessage: profile ? 'Profile updated successfully' : 'Profile created successfully' },
    );

    setData(result);
    reset({
      personal: values.personal,
      education: values.education,
    });
  };

    const handleDelete = async () => {
    if (!profile?._id) return;
    await runWithLoading(() => deleteProfile(profile._id), { successMessage: 'Profile deleted successfully' });
    setData(null);
    reset(blankFormValues());
  };

  const handleReset = () => {
    if (profile) {
      reset({
        personal: profile.personal || blankFormValues().personal,
        education: profile.education || blankFormValues().education,
      });
      return;
    }
    reset(blankFormValues());
  };

  if (loading && !profileResponse) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ErrorMessage title="Profile could not load" message={error.message} icon={AlertCircle} />;
  }

  const hasProfile = Boolean(profile?._id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <PageHeader
          eyebrow="Student profile"
          title="Profile and placement target"
          description="Maintain your personal details and education using the backend profile API."
        />

        <form className="mt-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-5">
            <SectionTitle
              icon={UserCircle2}
              title="Personal details"
              description="Keep your profile information current for recommendations and reports."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                {...register('personal.fullName', { required: 'Full name is required' })}
                error={errors.personal?.fullName?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('personal.email', { required: 'Email is required' })}
                error={errors.personal?.email?.message}
              />
              <Input label="Phone" {...register('personal.phone')} />
              <Input label="Location" {...register('personal.location')} />
              <Input label="GitHub" {...register('personal.github')} />
              <Input label="LinkedIn" {...register('personal.linkedin')} />
            </div>
            <Textarea label="Bio" rows={4} {...register('personal.bio')} />
          </section>

          <section className="space-y-5">
            <SectionTitle
              icon={CheckCircle2}
              title="Target career role"
              description="Career role selection now flows through the dedicated catalog so gap analysis uses a real stored role id."
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Current role</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-white">{profile?.personal?.targetRole || 'No role selected yet'}</p>
                {profile?.personal?.targetRoleSource ? (
                  <Badge tone={profile.personal.targetRoleSource === 'ai_generated' ? 'warning' : 'success'}>
                    {profile.personal.targetRoleSource === 'ai_generated' ? 'AI Generated' : 'Seeded'}
                  </Badge>
                ) : null}
              </div>
              <Button as={Link} to="/roles" variant="secondary" className="mt-4">
                Choose career role
              </Button>
            </div>
          </section>

          <section className="space-y-5">
            <SectionTitle
              icon={GraduationCap}
              title="Education"
              description="Store your academic details for placement readiness calculations."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Institution" {...register('education.institution')} />
              <Input label="Degree" {...register('education.degree')} />
              <Input label="Semester" {...register('education.semester')} />
              <Input label="CGPA" {...register('education.cgpa')} />
              <Input label="Graduation year" {...register('education.graduationYear')} />
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isSubmitting} icon={CheckCircle2}>
              {hasProfile ? 'Update profile' : 'Create profile'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset changes
            </Button>
            <Button type="button" variant="ghost" icon={Trash2} onClick={handleDelete} disabled={!hasProfile}>
              Delete profile
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <SectionTitle
            icon={UserRoundCheck}
            title="Assigned mentor"
            description="Your mentor assignment is managed by the institution administrator."
          />
          {profile?.assignedMentor ? (
            <div className="mt-5 rounded-2xl border border-brand-300/20 bg-brand-500/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-white">{profile.assignedMentor.name}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-200" />
                      {profile.assignedMentor.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-brand-200" />
                      {profile.assignedMentor.department || 'Department not specified'}
                    </p>
                  </div>
                </div>
                <Badge tone={profile.assignedMentor.isActive ? 'success' : 'warning'}>
                  {profile.assignedMentor.isActive ? 'Active mentor' : 'Currently inactive'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
              <p className="font-medium text-white">No mentor assigned yet</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                An administrator will assign a mentor to support evidence reviews and placement readiness.
              </p>
            </div>
          )}
        </Card>

        <Card>
          {hasProfile ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Profile summary</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{profile.personal?.fullName}</h2>
                <p className="mt-1 text-sm text-slate-400">{profile.personal?.email}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
                <UserCircle2 className="h-6 w-6" />
              </div>
            </div>
          ) : (
            <EmptyState
              title="No profile yet"
              description="Create the student profile using the form on the left."
            />
          )}

          {hasProfile ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Readiness score</p>
                  <p className="mt-2 text-4xl font-semibold text-white">{profile.overallReadiness}%</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Top skills</p>
                  <Button as={Link} to="/evidence" variant="ghost" size="sm">View all skills</Button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[48rem] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="pb-3 font-medium">Skill</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Level</th>
                        <th className="pb-3 font-medium">Trust</th>
                        <th className="pb-3 font-medium">Evidence</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {profileSkills.map((skill) => {
                        const status = skillStatus(skill);
                        return (
                          <tr key={skill._id}>
                            <td className="py-3 font-medium text-white">{skill.name}</td>
                            <td className="py-3 text-slate-400">{skill.category || 'Other'}</td>
                            <td className="py-3"><Badge tone="info">{skill.levelLabel || skillLevelLabel(skill.level)}</Badge></td>
                            <td className="py-3">
                              <Badge tone={skill.trustLevel === 'high' ? 'success' : skill.trustLevel === 'medium' ? 'info' : 'warning'}>
                                {skill.trustLevel || 'medium'} trust
                              </Badge>
                            </td>
                            <td className="py-3"><Badge tone="neutral">{skillEvidenceLabel(skill)}</Badge></td>
                            <td className="py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!profileSkills.length ? (
                    <p className="py-4 text-sm text-slate-400">No skills saved yet. Review a resume or add skill evidence.</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Experience</p>
                <div className="mt-4 space-y-3">
                  {(profile.experience || []).map((item) => (
                    <div key={`${item.company}-${item.role}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-semibold text-white">{item.role}</p>
                      <p className="text-sm text-slate-400">
                        {item.company} • {item.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Certifications</p>
                <div className="mt-4 space-y-3">
                  {(profile.certifications || []).map((cert) => (
                    <div key={`${cert.name}-${cert.issuer}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-semibold text-white">{cert.name}</p>
                      <p className="text-sm text-slate-400">
                        {cert.issuer} • {cert.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {hasProfile ? (
          <p className="text-xs text-slate-500">Last updated {formatDateTime(profile.updatedAt)}</p>
        ) : null}
      </div>
    </div>
  );
}
