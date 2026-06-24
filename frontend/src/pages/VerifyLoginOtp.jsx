import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { homeForRole } from '@/utils/roleRouting';

export function VerifyLoginOtp() {
  const navigate = useNavigate();
  const { confirmLoginOtp, pendingAuth, isAuthenticated, authLoading, user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(user?.mustChangePassword ? '/change-password' : homeForRole(user?.role), { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    if (!pendingAuth.email) {
      navigate('/login', { replace: true });
    }
  }, [navigate, pendingAuth.email]);

  const onSubmit = async (values) => {
    try {
      const response = await confirmLoginOtp({
        email: pendingAuth.email,
        otp: values.otp,
      });
      toast.success(response.message || 'Login verified');
      navigate(
        response.user?.mustChangePassword ? '/change-password' : homeForRole(response.user?.role),
        { replace: true },
      );
    } catch (error) {
      toast.error(error.message || 'Unable to verify login OTP');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-3xl items-center">
      <Card className="w-full">
        <div className="space-y-5">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Verify login OTP</h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit code sent to <span className="text-white">{pendingAuth.email || 'your email'}</span>.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="OTP"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              {...register('otp', {
                required: 'OTP is required',
                pattern: { value: /^\d{6}$/, message: 'Enter a 6-digit OTP' },
              })}
              error={errors.otp?.message}
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting} icon={ArrowRight}>
              Verify login
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400">
            Need a new code?{' '}
            <Link className="font-medium text-brand-200 hover:text-brand-100" to="/login">
              Go back to login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
