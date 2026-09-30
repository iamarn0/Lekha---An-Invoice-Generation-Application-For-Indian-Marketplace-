import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function LogoMark({ className, tone = 'brand' }) {
  const fill = tone === 'light' ? '#FFFFFF' : tone === 'ink' ? '#171717' : '#4338CA';
  const line = tone === 'light' ? '#4338CA' : '#FFFFFF';
  const rule = tone === 'light' ? '#D97706' : '#F3E6D0';
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', className)}>
      <rect width="32" height="32" rx="8" fill={fill} />
      <path d="M9.2 8.2h8.6c.3 0 .6.1.8.3l4.1 4.1c.2.2.3.5.3.8v10.2c0 .9-.7 1.6-1.6 1.6H9.2c-.9 0-1.6-.7-1.6-1.6V9.8c0-.9.7-1.6 1.6-1.6Z" stroke={line} strokeWidth="1.4" fill="none" />
      <path d="M17.6 8.4V13h4.6" stroke={line} strokeWidth="1.4" fill="none" />
      <path d="M11.2 17.2h8.2M11.2 20.2h5.4" stroke={rule} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = 'dark', withWordmark = true, to, className }) {
  const word = tone === 'light' ? 'text-white' : 'text-ink';
  const mark = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone === 'light' ? 'light' : 'brand'} />
      {withWordmark ? <span className={cn('text-[15px] font-semibold tracking-[0.16em]', word)}>LEKHA</span> : null}
    </span>
  );

  if (!to) return mark;
  return (
    <Link to={to} className="rounded-md" aria-label="LEKHA home">
      {mark}
    </Link>
  );
}
