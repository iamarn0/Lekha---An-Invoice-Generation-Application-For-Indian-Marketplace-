import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <section className={cn('rounded-xl border border-line bg-white', className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
