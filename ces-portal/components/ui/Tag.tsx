import { clsx } from 'clsx';
import { ReactNode } from 'react';

type Tone = 'neutral' | 'teal' | 'deep' | 'success' | 'warning' | 'info';

interface TagProps {
  children: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-brand-bg-soft text-brand-deep border border-brand-deep/15',
  teal: 'bg-brand-tint-3 text-brand-deep border border-brand-tint-2/40',
  deep: 'bg-brand-deep text-white border border-brand-deep',
  success: 'bg-success/10 text-success border border-success/30',
  warning: 'bg-warning/10 text-warning border border-warning/30',
  info: 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30',
};

export function Tag({ children, tone = 'neutral', size = 'sm', className }: TagProps) {
  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        toneClasses[tone],
        sizeCls,
        className,
      )}
    >
      {children}
    </span>
  );
}
