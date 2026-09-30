export function EmptyState({ icon: Icon, title, description, action, ledger = false }) {
  return (
    <div className={`flex flex-col items-center px-6 py-16 text-center ${ledger ? 'ledger-lines' : ''}`}>
      {Icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-accent">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-3 font-medium text-danger underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
