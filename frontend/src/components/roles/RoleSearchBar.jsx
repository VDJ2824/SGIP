import { Filter, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export function RoleSearchBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  experienceLevel,
  onExperienceLevelChange,
  categories = [],
  experienceLevels = [],
  onClear,
  onGenerate,
  canGenerate = false,
  isGenerating = false,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_auto_auto]">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-200">Search roles</span>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search Data Scientist, ML Engineer, Fullstack Developer..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </label>

      <Select label="Category" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="all">All categories</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select label="Experience" value={experienceLevel} onChange={(event) => onExperienceLevelChange(event.target.value)}>
        <option value="all">All levels</option>
        {experienceLevels.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <div className="flex items-end">
        <Button variant="secondary" icon={Filter} onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="flex items-end">
        <Button variant="secondary" icon={Sparkles} onClick={onGenerate} disabled={!canGenerate} isLoading={isGenerating}>
          Generate
        </Button>
      </div>
    </div>
  );
}

