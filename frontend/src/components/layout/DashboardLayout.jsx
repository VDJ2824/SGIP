import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="dashboard-shell py-6">
        <div className="grid w-full gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <Sidebar />
          <div className="min-w-0 space-y-6">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
