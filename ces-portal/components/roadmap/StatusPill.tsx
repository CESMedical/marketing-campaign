import { Status, STATUS_LABELS } from '@/types/post';
import { Tag } from '@/components/ui/Tag';
import { getStatusTone } from '@/lib/format';

export function StatusPill({ status }: { status: Status }) {
  const tone = getStatusTone(status);
  return <Tag tone={tone}>{STATUS_LABELS[status]}</Tag>;
}
