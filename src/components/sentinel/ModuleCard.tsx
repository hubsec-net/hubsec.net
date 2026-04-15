import { Card } from '@/components/ui/Card';

interface ModuleCardProps {
  name: string;
  description: string;
}

export function ModuleCard({ name, description }: ModuleCardProps) {
  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-accent-primary)',
        }}
      >
        {name}
      </h3>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </Card>
  );
}
