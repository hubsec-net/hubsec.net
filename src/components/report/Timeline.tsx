import type { TimelineEvent } from '@/lib/types';

interface TimelineProps {
  events: TimelineEvent[];
}

const phaseColors: Record<string, string> = {
  preparation: 'var(--color-severity-info)',
  execution: 'var(--color-severity-critical)',
  extraction: 'var(--color-severity-high)',
  aftermath: 'var(--color-text-tertiary)',
};

const phaseLabels: Record<string, string> = {
  preparation: 'Preparation',
  execution: 'Execution',
  extraction: 'Extraction',
  aftermath: 'Aftermath',
};

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="timeline-section mb-8">
      <div className="relative">
        {/* Connecting line */}
        <div
          className="absolute left-[7px] top-3 bottom-3 w-px"
          style={{ backgroundColor: 'var(--color-border-default)' }}
        />

        <div className="flex flex-col gap-6">
          {events.map((event, i) => {
            const color = phaseColors[event.phase] || 'var(--color-text-tertiary)';
            const showPhaseLabel =
              i === 0 || events[i - 1].phase !== event.phase;

            return (
              <div key={i} className="relative pl-8">
                {/* Dot */}
                <div
                  className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2"
                  style={{
                    borderColor: color,
                    backgroundColor: 'var(--color-bg-primary)',
                  }}
                >
                  <div
                    className="absolute inset-[3px] rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span
                      className="text-xs"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        fontFamily: 'var(--font-jetbrains), monospace',
                      }}
                    >
                      {event.date}
                    </span>
                    {showPhaseLabel && (
                      <span
                        className="text-xs uppercase px-2 py-0.5 rounded"
                        style={{
                          color: color,
                          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                          fontFamily: 'var(--font-jetbrains), monospace',
                          letterSpacing: 'var(--tracking-wide)',
                        }}
                      >
                        {phaseLabels[event.phase]}
                      </span>
                    )}
                  </div>
                  <h4
                    className="text-sm font-semibold mb-1"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-jetbrains), monospace',
                    }}
                  >
                    {event.title}
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
