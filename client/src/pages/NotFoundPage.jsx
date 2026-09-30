import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/ui/Button';
import { usePageMeta } from '../hooks/usePageMeta';

export function NotFoundPage() {
  usePageMeta('Page not found', 'That LEKHA page does not exist.');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 font-serif text-4xl text-navy-900">This page is not in the workspace.</h1>
      <p className="mt-3 max-w-md text-sm text-muted">The link may be old, or the record may have been removed.</p>
      <Link to="/" className={`${buttonClasses()} mt-6`}>Back home</Link>
    </div>
  );
}
