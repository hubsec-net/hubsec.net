'use client';

interface DirectionBadgeProps {
  direction: 'in' | 'out' | 'self';
}

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  const config = {
    in: { label: 'IN', color: 'var(--color-flow-in)', bg: 'rgba(52, 211, 153, 0.12)' },
    out: { label: 'OUT', color: 'var(--color-flow-out)', bg: 'rgba(248, 113, 113, 0.12)' },
    self: { label: 'SELF', color: 'var(--color-flow-self)', bg: 'rgba(148, 163, 184, 0.12)' },
  };

  const c = config[direction];

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{
        color: c.color,
        backgroundColor: c.bg,
        fontFamily: 'var(--font-jetbrains), monospace',
        minWidth: '3rem',
        textAlign: 'center',
      }}
    >
      {c.label}
    </span>
  );
}
