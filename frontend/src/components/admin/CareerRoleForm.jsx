import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

function names(items = []) {
  return items.map((item) => typeof item === 'string' ? item : item.name).join(', ');
}

export function CareerRoleForm({ role, onSubmit, onCancel, saving }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  useEffect(() => reset({
    title: role?.title || '', category: role?.category || '', experienceLevel: role?.experienceLevel || 'Entry Level',
    description: role?.description || '', aliases: (role?.aliases || []).join(', '), requiredSkills: names(role?.requiredSkills),
    preferredSkills: names(role?.preferredSkills), roadmapHints: (role?.roadmapHints || []).join('\n'),
  }), [role, reset]);
  const submit = (values) => onSubmit({
    title: values.title,
    category: values.category,
    experienceLevel: values.experienceLevel,
    description: values.description,
    aliases: values.aliases.split(',').map((item) => item.trim()).filter(Boolean),
    requiredSkills: values.requiredSkills.split(',').map((name) => ({ name: name.trim(), category: values.category, importance: 'Medium', minimumLevel: 'Intermediate' })).filter((item) => item.name),
    preferredSkills: values.preferredSkills.split(',').map((name) => ({ name: name.trim(), category: values.category })).filter((item) => item.name),
    roadmapHints: values.roadmapHints.split('\n').map((item) => item.trim()).filter(Boolean),
  });
  return <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
    <Input label="Role title" error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
    <Input label="Category" error={errors.category?.message} {...register('category', { required: 'Category is required' })} />
    <Select label="Experience level" {...register('experienceLevel')}><option>Entry Level</option><option>Mid Level</option><option>Senior Level</option></Select>
    <Input label="Aliases (comma-separated)" {...register('aliases')} />
    <Textarea className="md:col-span-2" label="Description" rows={4} {...register('description')} />
    <Textarea className="md:col-span-2" label="Required skills (comma-separated)" rows={3} error={errors.requiredSkills?.message} {...register('requiredSkills', { required: 'At least one skill is required' })} />
    <Textarea className="md:col-span-2" label="Preferred skills (comma-separated)" rows={2} {...register('preferredSkills')} />
    <Textarea className="md:col-span-2" label="Roadmap hints (one per line)" rows={3} {...register('roadmapHints')} />
    <div className="md:col-span-2 flex justify-end gap-3"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" isLoading={saving}>{role ? 'Save role' : 'Create role'}</Button></div>
  </form>;
}
