import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, Settings, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden">
      <ul className="grid grid-cols-5">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium',
                isActive ? 'text-accent' : 'text-muted'
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
