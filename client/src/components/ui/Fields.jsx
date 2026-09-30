import { cn } from '../../utils/cn';

export const fieldClass = 'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-sand';

function FieldShell({ id, label, labelClassName, required, hint, error, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      {label ? (
        <label htmlFor={id} className={cn('mb-1.5 block text-[13px] font-medium text-ink', labelClassName)}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="text-red-700"> *</span>
              <span className="sr-only"> required</span>
            </>
          ) : null}
        </label>
      ) : null}
      {children(errorId || hintId)}
      {error ? <p id={errorId} className="mt-1.5 text-xs text-red-700">{error}</p> : null}
      {hint && !error ? <p id={hintId} className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ id, label, labelClassName, required, hint, error, className, ...props }) {
  const inputId = id || props.name;
  return (
    <FieldShell id={inputId} label={label} labelClassName={labelClassName} required={required} hint={hint} error={error}>
      {(describedBy) => (
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClass, error && 'border-red-400', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export function Textarea({ id, label, required, hint, error, className, ...props }) {
  const inputId = id || props.name;
  return (
    <FieldShell id={inputId} label={label} required={required} hint={hint} error={error}>
      {(describedBy) => (
        <textarea
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClass, 'h-auto min-h-28 resize-y py-2.5', error && 'border-red-400', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export function Select({ id, label, required, hint, error, className, children, ...props }) {
  const inputId = id || props.name;
  return (
    <FieldShell id={inputId} label={label} required={required} hint={hint} error={error}>
      {(describedBy) => (
        <select
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(fieldClass, error && 'border-red-400', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
