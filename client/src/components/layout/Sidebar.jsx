import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, Settings, Users, X, Activity } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/activity', label: 'Activity', icon: Activity },
];

export function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const initials = (user?.name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <>
      {open ? <button type="button" className="fixed inset-0 z-40 bg-ink/30 lg:hidden" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between px-4">
          <Logo to="/app" />
          <button type="button" className="rounded-md p-1 text-muted lg:hidden" aria-label="Close navigation" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Workspace" className="flex-1 space-y-0.5 px-3 py-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium',
                isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sand hover:text-ink'
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium',
              isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sand hover:text-ink'
            )}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </NavLink>
          <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{user?.name || 'Account'}</span>
              <span className="block truncate text-xs text-muted">{user?.businessName || 'Workspace'}</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
