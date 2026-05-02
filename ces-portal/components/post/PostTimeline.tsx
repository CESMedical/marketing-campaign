import { Status, STATUS_LABELS, STATUS_ORDER } from '@/types/post';
import { Check, Circle } from 'lucide-react';
import { clsx } from 'clsx';

export function PostTimeline({ status }: { status: Status }) {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <section
      aria-labelledby="approval-heading"
      className="rounded-xl border border-brand-deep/10 bg-brand-bg-soft p-5"
    >
      <h2
        id="approval-heading"
        className="mb-4 font-display text-base font-semibold text-brand-deep"
      >
        Approval workflow
      </h2>
      <ol className="flex flex-col gap-3">
        {STATUS_ORDER.map((s, idx) => {
          const reached = idx <= currentIdx;
          const current = idx === currentIdx;
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  reached
                    ? 'border-brand-teal bg-brand-teal text-white'
                    : 'border-brand-deep/20 bg-white text-muted',
                  current && 'ring-2 ring-brand-teal/30',
                )}
                aria-hidden="true"
              >
                {reached ? <Check size={12} /> : <Circle size={6} fill="currentColor" />}
              </span>
              <span
                className={clsx(
                  'text-sm',
                  reached ? 'font-medium text-brand-deep' : 'text-muted',
                  current && 'font-semibold',
                )}
              >
                {STATUS_LABELS[s]}
                {current && <span className="ml-2 text-xs text-brand-teal">(current)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
