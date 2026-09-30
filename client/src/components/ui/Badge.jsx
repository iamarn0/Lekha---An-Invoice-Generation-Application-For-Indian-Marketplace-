import { cn } from '../../utils/cn';

const tones = {
  draft: 'bg-sand text-muted',
  sent: 'bg-accent-soft text-accent',
  paid: 'bg-emerald-50 text-success',
  overdue: 'bg-red-50 text-danger',
  cancelled: 'bg-sand text-faint',
  active: 'bg-emerald-50 text-success',
  inactive: 'bg-sand text-muted',
};

export function Badge({ tone = 'draft', children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize', tones[tone] || tones.draft, className)}>
      {children || tone}
    </span>
  );
}
