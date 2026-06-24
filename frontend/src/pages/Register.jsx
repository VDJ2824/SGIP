import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, authLoading } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    try {
      const response = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      const devHint = import.meta.env.DEV && response.debugOtp ? ` Dev OTP: ${response.debugOtp}` : '';
      toast.success((response.message || 'Registration OTP sent') + devHint);
      navigate('/verify-register-otp', {
        replace: true,
        state: import.meta.env.DEV && response.debugOtp ? { email: values.email, debugOtp: response.debugOtp } : { email: values.email },
      });
    } catch (error) {
      toast.error(error.message || 'Unable to send registration OTP');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="mx-auto w-full max-w-xl">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <h2 className="text-2xl font-semibold text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-400">Register once, then verify your email with a one-time code.</p>
            <p className="mt-2 rounded-xl bg-brand-500/10 p-3 text-sm text-brand-700">
              Student registration only. Mentors and admins are created by the institution.
            </p>
          </div>
          <Input
            label="Name"
            leftIcon={User}
            autoComplete="name"
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })}
            error={errors.name?.message}
          />
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
            autoComplete="new-password"
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            leftIcon={Lock}
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Confirm your password',
              validate: (value) => value === passwordValue || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting} icon={ArrowRight}>
            Send OTP
          </Button>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link className="font-medium text-brand-200 hover:text-brand-100" to="/login">
              Login
            </Link>
          </p>
        </form>
      </Card>

      <div className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-200">Join SGIP</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">Create your placement-ready profile.</h1>
        <p className="max-w-xl text-base leading-7 text-slate-300">
          Your account unlocks skill evidence, roadmap planning, analytics, and authenticated dashboard access.
        </p>
      </div>
    </div>
  );
}
