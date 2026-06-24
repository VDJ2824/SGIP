export function homeForRole(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'mentor') return '/mentor/dashboard';
  return '/dashboard';
}
