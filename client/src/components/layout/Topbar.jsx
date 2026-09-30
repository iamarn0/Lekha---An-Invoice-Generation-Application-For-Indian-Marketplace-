import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Menu, Search, Settings } from 'lucide-react';
import { activityApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatRelative } from '../../utils/format';
import { Menu as Dropdown, MenuItem } from '../ui/Menu';
import { CommandMenu } from './CommandMenu';

export function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const shortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

  const activity = useQuery({
    queryKey: ['activity', 'preview'],
    queryFn: () => activityApi.list({ limit: 6 }).then((response) => response.data.data.items),
  });

  useEffect(() => {
    function onKey(event) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      const tag = document.activeElement?.tagName;
      if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !commandOpen) {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [commandOpen]);

  const initials = (user?.name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button type="button" className="rounded-lg p-2 text-ink hover:bg-sand lg:hidden" aria-label="Open navigation" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 text-left text-sm text-faint md:max-w-md"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search anything...</span>
          <kbd className="ml-auto hidden rounded border border-line bg-sand px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">{shortcut}</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <Dropdown
            align="right"
            buttonClassName="p-2 text-ink hover:bg-sand"
            label={<><Bell className="h-4 w-4" /><span className="sr-only">Notifications</span></>}
          >
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Recent activity</p>
            {(activity.data || []).length === 0 ? <p className="px-3 py-2 text-sm text-muted">No activity yet.</p> : null}
            {(activity.data || []).map((item) => (
              <MenuItem key={item._id} to={item.invoice ? `/app/invoices/${item.invoice}` : '/app/activity'}>
                <span>
                  <span className="block">{item.message}</span>
                  <span className="text-xs text-muted">{formatRelative(item.createdAt)}</span>
                </span>
              </MenuItem>
            ))}
          </Dropdown>

          <Dropdown
            align="right"
            buttonClassName="h-9 gap-2 px-1.5 hover:bg-sand"
            label={(
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent">{initials}</span>
                <span className="sr-only">Account menu</span>
              </>
            )}
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <MenuItem to="/app/settings"><Settings className="h-4 w-4" /> Settings</MenuItem>
            <MenuItem onClick={logout}><LogOut className="h-4 w-4" /> Sign out</MenuItem>
          </Dropdown>
        </div>
      </div>
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </header>
  );
}
