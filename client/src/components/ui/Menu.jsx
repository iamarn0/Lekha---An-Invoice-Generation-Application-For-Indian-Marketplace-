import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function Menu({ label, align = 'right', children, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn('inline-flex items-center gap-2 rounded-lg', buttonClassName)}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-2 min-w-48 rounded-xl border border-line bg-white p-1 shadow-lift',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ children, onClick, to, className }) {
  const classes = cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-mist', className);
  if (to) {
    return <Link to={to} role="menuitem" className={classes} onClick={onClick}>{children}</Link>;
  }
  return <button type="button" role="menuitem" className={classes} onClick={onClick}>{children}</button>;
}
