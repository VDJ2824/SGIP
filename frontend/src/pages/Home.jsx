import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BrainCircuit, GraduationCap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

const highlights = [
  { icon: BarChart3, title: 'Skill Intelligence', text: 'Measure current capabilities against role expectations.' },
  { icon: BrainCircuit, title: 'Roadmap Planning', text: 'Turn gaps into focused learning milestones.' },
  { icon: ShieldCheck, title: 'Placement Readiness', text: 'Track evidence and readiness in one streamlined workspace.' },
];

export function Home() {
  const appName = import.meta.env.VITE_APP_NAME || 'SGIP Platform';
  const { isAuthenticated } = useAuth();
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-hero-grid p-6 shadow-glow sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge tone="info" className="w-fit">Production-ready student analytics</Badge>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-200">
                Skill Gap Intelligence Platform
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Close the gap between where you are and the role you want.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                SGIP helps students assess their skills, compare them to job-ready role requirements, identify
                gaps, generate roadmaps, and prove readiness with evidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button as={Link} to="/dashboard" icon={ArrowRight} size="lg">
                  Open Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/register" icon={ArrowRight} size="lg">
                    Get Started
                  </Button>
                  <Button as={Link} to="/login" variant="secondary" size="lg">
                    Login
                  </Button>
                </>
              )}
              <Button as={Link} to="/roles" variant="secondary" size="lg">
                Explore Roles
              </Button>
            </div>
          </div>

          <motion.div
            className="grid gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white/5">
              <p className="text-sm text-slate-400">Platform</p>
              <p className="mt-2 text-2xl font-semibold text-white">{appName}</p>
              <p className="mt-2 text-sm text-slate-300">Connected to live backend APIs.</p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-sm text-slate-400">Evidence submitted</p>
                <p className="mt-2 text-3xl font-semibold text-white">Live</p>
              </Card>
              <Card>
                <p className="text-sm text-slate-400">Active roadmap tasks</p>
                <p className="mt-2 text-3xl font-semibold text-white">Live</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="h-full">
              <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-medium text-brand-200">What SGIP gives you</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Role-aligned skill comparison with clear priority gaps</li>
            <li>• Evidence tracking for projects, certifications, and interview prep</li>
            <li>• A transparent roadmap with milestones and progress history</li>
            <li>• Reports and notifications for placement readiness review</li>
          </ul>
        </Card>
        <Card className="bg-white/5">
          <p className="text-sm font-medium text-brand-200">Built for scale</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This frontend is wired to live authentication and SGIP APIs, with route layouts, reusable UI primitives,
            responsive navigation, and polished loading/error states.
          </p>
        </Card>
      </section>
    </div>
  );
}
