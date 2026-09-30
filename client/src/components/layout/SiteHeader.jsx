import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { buttonClasses } from '../ui/Button';
import { cn } from '../../utils/cn';

const links = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo to="/" />
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn('text-sm', isActive ? 'font-medium text-navy-900' : 'text-muted hover:text-navy-900')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className={buttonClasses({ variant: 'ghost' })}>Log in</Link>
          <Link to="/register" className={buttonClasses()}>Start free</Link>
        </div>
        <button type="button" className="rounded-lg p-2 md:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line px-4 py-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm text-navy-900">
                {link.label}
              </NavLink>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className={buttonClasses({ variant: 'secondary', className: 'mt-2' })}>Log in</Link>
            <Link to="/register" onClick={() => setOpen(false)} className={buttonClasses()}>Start free</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
