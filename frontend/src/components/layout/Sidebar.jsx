import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, LogOut, UserCircle2 } from 'lucide-react';
import { dashboardNavigation } from '@/constants/navigation';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

function SidebarContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const visibleNavigation = dashboardNavigation.filter((item) => !item.roles || item.roles.includes(user?.role || 'student'));
  const workspace = user?.role === 'admin'
    ? { eyebrow: 'Institution control', title: 'Admin workspace', description: 'Manage people, catalog governance, and platform intelligence.' }
    : user?.role === 'mentor'
      ? { eyebrow: 'Mentor workspace', title: 'Guide with evidence', description: 'Review assigned student evidence and support readiness growth.' }
      : { eyebrow: 'Student workspace', title: 'Ready to grow', description: 'Track skill progress, compare roles, and keep your placement plan moving.' };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col justify-between gap-6 p-5">
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-200">Navigation</p>
            <p className="text-sm text-white">SGIP Menu</p>
          </div>
          <MobileClose />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{workspace.eyebrow}</p>
          <p className="text-2xl font-semibold text-white">{workspace.title}</p>
          <p className="text-sm leading-6 text-slate-400">{workspace.description}</p>
        </div>
        <nav className="space-y-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500/15 text-brand-100 border border-brand-300/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Account'}</p>
                <p className="break-all text-xs leading-5 text-slate-400">{user?.email || ''}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full" icon={LogOut} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-white">Placement readiness</p>
            <p className="mt-1 text-2xl font-semibold text-brand-200">Secure</p>
            <p className="mt-2 text-sm text-slate-400">Sign in to view your personalized readiness snapshot.</p>
          </>
        )}
      </div>
    </div>
  );
}

function MobileClose() {
  const { setSidebarOpen } = useAppContext();
  return <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} icon={X} aria-label="Close sidebar" />;
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppContext();

  return (
    <>
      <aside className="hidden lg:block">
        <div className="glass-panel sticky top-20 h-[calc(100vh-6rem)] w-full overflow-hidden rounded-3xl">
          <SidebarContent />
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen ? (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#17312d]/40 backdrop-blur-sm"
              aria-label="Close sidebar overlay"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="glass-panel absolute left-0 top-0 h-full w-[min(20rem,88vw)] rounded-none border-r border-white/10"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
