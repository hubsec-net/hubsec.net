import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
        transition: hover ? 'border-color 0.15s ease, background-color 0.15s ease' : undefined,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-default)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
      } : undefined}
    >
      {children}
    </div>
  );
}
