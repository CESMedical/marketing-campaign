import { Pillar, PILLAR_LABELS } from '@/types/post';
import { Tag } from '@/components/ui/Tag';

const pillarTone: Record<Pillar, 'neutral' | 'teal' | 'deep' | 'info'> = {
  educational: 'teal',
  business: 'deep',
  premises: 'neutral',
  employee: 'info',
  leadership: 'deep',
  events: 'neutral',
  tech: 'info',
};

export function PillarBadge({ pillar }: { pillar: Pillar }) {
  return <Tag tone={pillarTone[pillar]}>{PILLAR_LABELS[pillar]}</Tag>;
}
