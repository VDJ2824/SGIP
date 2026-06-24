import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { changePassword } from '@/services/authService';
import { homeForRole } from '@/utils/roleRouting';

export function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('newPassword');

  const submit = async (values) => {
    try {
      await changePassword(values);
      const updated = await refreshProfile();
      toast.success('Password changed successfully');
      navigate(homeForRole(updated?.role || user?.role), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to change password');
    }
  };

  return (
    <div className="mx-auto max-w-xl py-12">
      <Card>
        <LockKeyhole className="h-8 w-8 text-brand-500" />
        <h1 className="mt-4 text-3xl font-semibold text-white">Change password</h1>
        <p className="mt-2 text-sm text-slate-400">
          {user?.mustChangePassword ? 'Set a new password before continuing.' : 'Update your account password.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
          <Input label="Current password" type="password" {...register('currentPassword', { required: 'Current password is required' })} error={errors.currentPassword?.message} />
          <Input label="New password" type="password" {...register('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.newPassword?.message} />
          <Input label="Confirm new password" type="password" {...register('confirmPassword', { required: 'Confirm the new password', validate: (value) => value === password || 'Passwords do not match' })} error={errors.confirmPassword?.message} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Change password</Button>
        </form>
      </Card>
    </div>
  );
}
