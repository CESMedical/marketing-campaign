import { Star } from 'lucide-react';

export function PriorityFlag({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 12 : 14;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
      title="Commercial priority"
    >
      <Star size={dim} fill="currentColor" />
      Priority
    </span>
  );
}
