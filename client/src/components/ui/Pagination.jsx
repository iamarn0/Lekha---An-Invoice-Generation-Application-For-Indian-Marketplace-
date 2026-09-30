import { Button } from './Button';

export function Pagination({ page, pages, total, onPage, label = 'results' }) {
  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {total} {label}
        {pages > 1 ? ` · Page ${page} of ${pages}` : ''}
      </p>
      {pages > 1 ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
          <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
        </div>
      ) : null}
    </nav>
  );
}
