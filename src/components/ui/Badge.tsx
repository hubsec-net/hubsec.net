import type { SeverityLevel } from '@/lib/types';

interface BadgeProps {
  level: SeverityLevel;
  className?: string;
}

const badgeStyles: Record<SeverityLevel, { bg: string; text: string }> = {
  critical: { bg: 'rgba(255, 59, 92, 0.15)', text: 'var(--color-severity-critical)' },
  high: { bg: 'rgba(255, 140, 66, 0.15)', text: 'var(--color-severity-high)' },
  medium: { bg: 'rgba(255, 209, 102, 0.15)', text: 'var(--color-severity-medium)' },
  low: { bg: 'rgba(0, 212, 170, 0.15)', text: 'var(--color-severity-low)' },
  info: { bg: 'rgba(91, 141, 239, 0.15)', text: 'var(--color-severity-info)' },
};

export function Badge({ level, className = '' }: BadgeProps) {
  const style = badgeStyles[level];
  return (
    <span
      className={`severity-badge inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 'var(--font-size-xs)',
        letterSpacing: 'var(--tracking-wide)',
      }}
    >
      {level}
    </span>
  );
}
