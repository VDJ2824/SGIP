import { Menu, BellRing, Search, PanelLeftClose, LogOut, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { homeForRole } from '@/utils/roleRouting';

export function Navbar() {
  const { sidebarOpen, setSidebarOpen, globalLoading } = useAppContext();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const appName = import.meta.env.VITE_APP_NAME || 'SGIP Platform';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="dashboard-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            icon={sidebarOpen ? PanelLeftClose : Menu}
            aria-label="Toggle sidebar"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Skill Gap Intelligence Platform</p>
            <p className="text-sm font-semibold text-white">{appName}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
            <Search className="h-4 w-4" />
            <span>Search skills, roles, reports</span>
          </div>
          <Badge tone={globalLoading ? 'warning' : 'success'}>{globalLoading ? 'Syncing' : 'Live data'}</Badge>
          {isAuthenticated ? (
            <>
              <Button as={Link} to={homeForRole(user?.role)} variant="ghost" size="sm">
                {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'mentor' ? 'Mentor Dashboard' : 'Dashboard'}
              </Button>
              {user?.role === 'admin' ? (
                <Button as={Link} to="/admin/mentors" variant="ghost" size="sm">Mentors</Button>
              ) : null}
              {user?.role === 'mentor' ? (
                <Button as={Link} to="/mentor/evidence-review" variant="ghost" size="sm">Evidence Review</Button>
              ) : null}
              <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 lg:flex">
                <UserCircle2 className="h-4 w-4 text-brand-200" />
                <span>{user?.name || user?.email || 'Account'}</span>
              </div>
              <Button variant="secondary" size="sm" icon={BellRing} aria-label="Open notifications">
                Alerts
              </Button>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/auth" variant="secondary" size="sm">Access SGIP</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
