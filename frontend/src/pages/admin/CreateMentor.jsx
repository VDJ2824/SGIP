import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createMentor } from '@/services/adminService';

export function CreateMentor() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', email: '', department: '', temporaryPassword: '' },
  });

  const submit = async (values) => {
    try {
      await createMentor(values);
      toast.success('Mentor account created');
      navigate('/admin/mentors');
    } catch (error) {
      toast.error(error.message || 'Unable to create mentor');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Create mentor" description="The mentor will use this email and temporary password with the normal OTP login flow." />
      <Card className="max-w-3xl">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <Input label="Name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          <Input label="Department" {...register('department', { required: 'Department is required' })} error={errors.department?.message} />
          <Input label="Temporary password" type="password" {...register('temporaryPassword', { required: 'Temporary password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.temporaryPassword?.message} />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting}>Create Mentor</Button>
            <Button as={Link} to="/admin/dashboard" variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
