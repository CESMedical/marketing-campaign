import { clsx } from 'clsx';
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({ children, variant = 'default', className, ...rest }: CardProps) {
  const variantCls = {
    default: 'bg-white border border-brand-deep/10 hover:border-brand-deep/30 transition-colors',
    elevated: 'bg-white shadow-md hover:shadow-lg transition-shadow',
    flat: 'bg-brand-bg-soft border border-transparent',
  }[variant];

  return (
    <div className={clsx('rounded-xl', variantCls, className)} {...rest}>
      {children}
    </div>
  );
}
