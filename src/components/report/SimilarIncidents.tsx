import type { SimilarIncident } from '@/lib/types';

interface SimilarIncidentsProps {
  incidents: SimilarIncident[];
}

export function SimilarIncidents({ incidents }: SimilarIncidentsProps) {
  return (
    <div
      className="rounded-lg overflow-hidden mb-8"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
            {['Incident', 'Date', 'Loss', 'Similarity'].map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident, i) => (
            <tr
              key={i}
              style={{
                borderBottom: i < incidents.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
              }}
            >
              <td
                className="py-3 px-4 font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {incident.name}
              </td>
              <td
                className="py-3 px-4"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {incident.date}
              </td>
              <td
                className="py-3 px-4"
                style={{
                  color: 'var(--color-severity-critical)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {incident.loss}
              </td>
              <td
                className="py-3 px-4"
                style={{
                  color: 'var(--color-accent-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {incident.similarity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
