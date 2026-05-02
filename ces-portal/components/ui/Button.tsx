import { clsx } from 'clsx';
import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-teal text-white hover:bg-brand-deep focus-visible:bg-brand-deep border border-transparent',
  secondary:
    'bg-white text-brand-deep border border-brand-deep/20 hover:border-brand-deep hover:bg-brand-bg-soft',
  ghost:
    'bg-transparent text-brand-deep hover:bg-brand-bg-soft border border-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...rest
}: ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends ButtonBaseProps {
  href: string;
  external?: boolean;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  href,
  external,
}: LinkButtonProps) {
  const cls = clsx(baseClasses, variantClasses[variant], sizeClasses[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
