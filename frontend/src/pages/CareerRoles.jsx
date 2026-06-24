import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BriefcaseBusiness, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { useAppContext } from '@/context/AppContext';
import { getProfile } from '@/services/profileService';
import { getRole, intelligentSearchRole, listRoles } from '@/services/roleService';
import { runGapAnalysis } from '@/services/gapAnalysisService';
import { RoleSearchBar } from '@/components/roles/RoleSearchBar';
import { RoleCard } from '@/components/roles/RoleCard';
import { RoleDetailModal } from '@/components/roles/RoleDetailModal';
import { RoleSelector } from '@/components/roles/RoleSelector';

function RoleSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-[28rem]" />
    </div>
  );
}

function getRoleId(role) {
  return role?._id || role?.id || '';
}

export function CareerRoles() {
  const navigate = useNavigate();
  const { runWithLoading } = useAppContext();
  const { data, loading, error, execute, setData } = useAsync((params) => listRoles(params || { limit: 24 }));
  const { data: profileResponse, execute: refreshProfile } = useAsync(getProfile);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [detailRole, setDetailRole] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const roles = data?.data || [];
  const profile = profileResponse?.data || null;

  useEffect(() => {
    const timeout = setTimeout(() => {
      execute({
        limit: 24,
        search: query.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        experienceLevel: experienceLevel !== 'all' ? experienceLevel : undefined,
      }).catch(() => {});
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, category, experienceLevel, execute]);

  useEffect(() => {
    if (profile?.personal?.targetRoleId) {
      setSelectedRoleId(profile.personal.targetRoleId);
    }
  }, [profile?.personal?.targetRoleId]);

  useEffect(() => {
    if (!selectedRoleId && roles[0]) {
      setSelectedRoleId(getRoleId(roles[0]));
    }
  }, [roles, selectedRoleId]);

  const selectedRole = useMemo(() => roles.find((role) => getRoleId(role) === selectedRoleId) || detailRole || null, [roles, selectedRoleId, detailRole]);
  const categories = [...new Set(roles.map((role) => role.category).filter(Boolean))];
  const experienceLevels = [...new Set(roles.map((role) => role.experienceLevel).filter(Boolean))];

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setExperienceLevel('all');
  };

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    try {
      const result = await runWithLoading(
        () => intelligentSearchRole(query.trim()),
        { errorMessage: 'Unable to search or generate a role right now' },
      );

      const nextRole = result?.data?.role;
      if (!nextRole) return;

      setData((current) => {
        const items = current?.data || [];
        const withoutDuplicate = items.filter((item) => getRoleId(item) !== getRoleId(nextRole));
        return {
          ...(current || {}),
          data: [nextRole, ...withoutDuplicate],
        };
      });
      setSelectedRoleId(getRoleId(nextRole));
      setDetailRole(nextRole);
      toast.success(
        result?.data?.generated
          ? result?.data?.usedFallback
            ? 'Generated and saved a structured fallback role'
            : 'AI generated and saved a new role'
          : 'Matched an existing role from the catalog',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (role) => {
    if (!role?._id) {
      setDetailRole(role);
      return;
    }

    const result = await runWithLoading(() => getRole(role._id), { errorMessage: 'Unable to load role details' });
    setDetailRole(result?.data || role);
  };

  const handleSelectRole = async (role) => {
    if (!role) return;
    setIsSelecting(true);
    try {
      const analysis = await runWithLoading(
        () => runGapAnalysis(role._id),
        { successMessage: 'Target role selected and gap analysis generated' },
      );
      await refreshProfile();
      navigate(`/gaps/${analysis.data._id}`);
    } finally {
      setIsSelecting(false);
    }
  };

  if (loading && !data) return <RoleSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage title="Roles unavailable" message={error.message} icon={AlertCircle} />
        <Button onClick={() => execute({ limit: 24 })}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Career exploration"
          title="Career role catalog"
          description="Search MongoDB first, generate only when needed, and choose the one target role that drives your gap analysis."
          actions={
            <Button variant="secondary" onClick={() => execute({ limit: 24 })}>
              Refresh
            </Button>
          }
        />

        <Card>
          <RoleSearchBar
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            experienceLevel={experienceLevel}
            onExperienceLevelChange={setExperienceLevel}
            categories={categories}
            experienceLevels={experienceLevels}
            onClear={clearFilters}
            onGenerate={handleGenerate}
            canGenerate={Boolean(query.trim())}
            isGenerating={isGenerating}
          />
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {!roles.length ? (
              <EmptyState
                title="No matching role found"
                description="Search MongoDB first. If the exact role is still missing, generate a structured role and store it for reuse."
                actionLabel={query.trim() ? 'Generate with AI' : 'Refresh roles'}
                onAction={query.trim() ? handleGenerate : () => execute({ limit: 24 })}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role, index) => (
                  <RoleCard
                    key={getRoleId(role)}
                    role={role}
                    selected={selectedRoleId === getRoleId(role)}
                    onSelect={(nextRole) => setSelectedRoleId(getRoleId(nextRole))}
                    onPreview={handlePreview}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <RoleSelector role={selectedRole} onSelect={handleSelectRole} selecting={isSelecting} />

            <Card>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current profile target</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{profile?.personal?.targetRole || 'Not selected yet'}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {profile?.personal?.targetRoleSelectedAt
                      ? `Last selected ${new Date(profile.personal.targetRoleSelectedAt).toLocaleString()}`
                      : 'Select a role once to drive gap analysis and roadmap alignment.'}
                  </p>
                </div>
              </div>
            </Card>

            {query.trim() && !roles.length ? (
              <Card>
                <div className="flex items-start gap-4">
                  <Sparkles className="mt-1 h-5 w-5 text-brand-200" />
                  <div>
                    <p className="font-medium text-white">No equivalent role found yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      AI generation is only used after MongoDB search and fuzzy matching fail. The generated role will be validated, stored, and reused for the next search.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <RoleDetailModal
        role={detailRole}
        isOpen={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        onSelect={handleSelectRole}
        selecting={isSelecting}
      />
    </>
  );
}
