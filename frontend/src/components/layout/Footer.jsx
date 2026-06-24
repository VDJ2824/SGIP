export function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 text-sm text-slate-500">
      <div className="page-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SGIP Platform</p>
        <p>Skill gap analysis, roadmap planning, and placement readiness in one place.</p>
      </div>
    </footer>
  );
}
