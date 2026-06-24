import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut } from 'lucide-react';
import { publicNavigation } from '@/constants/navigation';
import { Button } from '@/components/ui/Button';
import { Footer } from './Footer';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { homeForRole } from '@/utils/roleRouting';

export function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between">
          <NavLink to="/" className="text-sm font-semibold tracking-[0.18em] text-white">
            SGIP
          </NavLink>
          <nav className="hidden items-center gap-2 md:flex">
            {publicNavigation
              .filter((item) => item.to !== '/dashboard' || isAuthenticated)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            {isAuthenticated ? (
              <>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {user?.name || user?.email || 'Signed in'}
                </div>
                <Button as={Link} to={homeForRole(user?.role)} variant="primary" size="sm" icon={ArrowRight}>
                  Open Dashboard
                </Button>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/auth" variant="secondary" size="sm">Login</Button>
                <Button as={Link} to="/register" variant="primary" size="sm">Student Register</Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="page-shell py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
