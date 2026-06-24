import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export function VerifyRegisterOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmRegisterOtp, pendingAuth } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    const email = pendingAuth.email || location.state?.email;
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [location.state?.email, navigate, pendingAuth.email]);

  const onSubmit = async (values) => {
    try {
      const response = await confirmRegisterOtp({
        email: pendingAuth.email,
        otp: values.otp,
      });
      toast.success(response.message || 'Email verified. Please log in.');
      navigate('/login', {
        replace: true,
        state: { email: pendingAuth.email || location.state?.email, verified: true },
      });
    } catch (error) {
      toast.error(error.message || 'Unable to verify registration OTP');
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
            <h2 className="text-2xl font-semibold text-white">Verify registration OTP</h2>
            <p className="mt-2 text-sm text-slate-400">
              We sent a 6-digit code to <span className="text-white">{pendingAuth.email || location.state?.email || 'your email'}</span>.
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
              Verify account
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400">
            Need a different account?{' '}
            <Link className="font-medium text-brand-200 hover:text-brand-100" to="/register">
              Register again
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
