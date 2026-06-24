import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';

export function AuthLanding() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-10">
      <PageHeader
        eyebrow="Choose category"
        title="Access your SGIP workspace"
        description="Students may register publicly. Mentor and administrator accounts are provisioned by the institution."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <GraduationCap className="h-8 w-8 text-brand-500" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Student</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Create your account or continue with the existing OTP login flow.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button as={Link} to="/login?role=student">Student Login</Button>
            <Button as={Link} to="/register" variant="secondary">Register</Button>
          </div>
        </Card>
        <Card>
          <ShieldCheck className="h-8 w-8 text-accent-600" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Mentor / Admin</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use the account created by your institution. Public staff registration is disabled.</p>
          <Button as={Link} to="/login?role=staff" className="mt-6">Staff Login</Button>
        </Card>
      </div>
    </div>
  );
}
