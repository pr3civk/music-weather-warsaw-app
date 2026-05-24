import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const links = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/correlation', label: 'Correlation' },
  { to: '/dashboard/weather', label: 'Weather' },
  { to: '/dashboard/music', label: 'Music' },
  { to: '/dashboard/export', label: 'Export' },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    await logout();
    nav('/login');
  }

  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen">
      <aside className="bg-sidebar border-r border-sidebar-border flex flex-col py-5">
        <div className="px-5 pb-5 border-b border-sidebar-border">
          <div className="font-semibold text-[15px] tracking-tight">MusicWeather</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60 mt-0.5">
            Warsaw
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
          <div className="text-xs text-sidebar-foreground/70 flex items-center gap-2">
            <span className="text-sidebar-foreground font-medium truncate">{user?.name}</span>
            {user?.role === 'admin' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                admin
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="px-8 py-7 max-w-[1300px] w-full">
        <Outlet />
      </main>
    </div>
  );
}
