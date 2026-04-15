import { Badge } from '@/components/ui/Badge';
import type { SeverityLevel } from '@/lib/types';

interface SeverityBadgeProps {
  level: SeverityLevel;
}

export function SeverityBadge({ level }: SeverityBadgeProps) {
  return <Badge level={level} />;
}
