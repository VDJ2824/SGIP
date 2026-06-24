import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { homeForRole } from '@/utils/roleRouting';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, authLoading, user } = useAuth();
  const staffLogin = new URLSearchParams(location.search).get('role') === 'staff';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    defaultValues: {
      email: location.state?.email || '',
      password: '',
    },
  });

  useEffect(() => {
    if (location.state?.email) {
      setValue('email', location.state.email);
    }
  }, [location.state, setValue]);

  useEffect(() => {
    if (location.state?.verified) {
      toast.success('Account verified. Please sign in.');
    }
  }, [location.state?.verified]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(user?.mustChangePassword ? '/change-password' : homeForRole(user?.role), { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, user?.role]);

  const onSubmit = async (values) => {
    try {
      const response = await login(values);
      const devHint = import.meta.env.DEV && response.debugOtp ? ` Dev OTP: ${response.debugOtp}` : '';
      toast.success((response.message || 'OTP sent to your email') + devHint);
      navigate('/verify-login-otp', {
        replace: true,
        state: import.meta.env.DEV && response.debugOtp ? { debugOtp: response.debugOtp } : undefined,
      });
    } catch (error) {
      toast.error(error.message || 'Unable to send login OTP');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-200">{staffLogin ? 'Institution access' : 'Welcome back'}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          {staffLogin ? 'Mentor/Admin Login' : 'Student Login'}
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-300">
          Access your profile, roadmap, reports, and placement readiness dashboard after OTP verification.
        </p>
        {user ? <p className="text-sm text-slate-400">Session detected for {user.email}.</p> : null}
        <div className="flex gap-3">
          {!staffLogin ? <Button as={Link} to="/register" variant="secondary">Create account</Button> : null}
          <Button as={Link} to="/auth" variant="ghost">Change category</Button>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-xl">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <h2 className="text-2xl font-semibold text-white">{staffLogin ? 'Staff login' : 'Student login'}</h2>
            <p className="mt-2 text-sm text-slate-400">Enter your email and password. We will send a verification OTP next.</p>
          </div>
          <Input
            label="Email"
            type="email"
            leftIcon={Mail}
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            leftIcon={Lock}
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting} icon={ArrowRight}>
            Send OTP
          </Button>
          {!staffLogin ? <p className="text-center text-sm text-slate-400">
            New here?{' '}
            <Link className="font-medium text-brand-200 hover:text-brand-100" to="/register">
              Create an account
            </Link>
          </p> : null}
        </form>
      </Card>
    </div>
  );
}
