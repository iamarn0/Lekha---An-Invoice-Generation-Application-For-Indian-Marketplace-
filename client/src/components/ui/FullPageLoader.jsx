import { Loader2 } from 'lucide-react';
import { Logo } from '../layout/Logo';

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mist text-sm text-muted">
      <Logo />
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading LEKHA
      </div>
    </div>
  );
}
