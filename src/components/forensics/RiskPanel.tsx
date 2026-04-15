interface RiskFlag {
  type: string;
  score: number;
  detail: string;
}

const flags: RiskFlag[] = [
  { type: 'NewWallet', score: 30, detail: '33 days old' },
  { type: 'PrivacyFunding', score: 25, detail: 'Railgun source' },
  { type: 'BridgeProbing', score: 20, detail: '15 test contracts' },
  { type: 'RapidDeploy', score: 15, detail: '17 contracts in 33 days' },
];

const totalScore = 94;

export function RiskPanel() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="text-xs uppercase"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-tertiary)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          Address
        </span>
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-secondary)',
          }}
        >
          0xC513...F8E7
        </span>
      </div>

      {/* Score gauge */}
      <div className="flex items-center gap-6 mb-8">
        {/* Circular score */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="var(--color-border-default)"
              strokeWidth="6"
            />
            {/* Score arc */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="var(--color-severity-critical)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(totalScore / 100) * 251.3} 251.3`}
              transform="rotate(-90 48 48)"
            />
            {/* Score text */}
            <text
              x="48"
              y="44"
              textAnchor="middle"
              fill="var(--color-text-primary)"
              fontSize="24"
              fontWeight="700"
              fontFamily="var(--font-jetbrains), monospace"
            >
              {totalScore}
            </text>
            <text
              x="48"
              y="60"
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
              fontSize="10"
              fontFamily="var(--font-jetbrains), monospace"
            >
              / 100
            </text>
          </svg>
        </div>

        <div>
          <span
            className="inline-block text-xs font-semibold uppercase px-2 py-0.5 rounded mb-2"
            style={{
              color: 'var(--color-severity-critical)',
              backgroundColor: 'rgba(255, 59, 92, 0.15)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Critical Risk
          </span>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This address exhibits multiple high-confidence indicators of malicious intent.
            Automated risk scoring based on age, funding source, behavior, and interaction patterns.
          </p>
        </div>
      </div>

      {/* Flag breakdown */}
      <div className="space-y-3">
        <p
          className="text-xs uppercase mb-2"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-tertiary)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          Risk Factors
        </p>
        {flags.map((flag) => {
          const barWidth = (flag.score / totalScore) * 100;
          return (
            <div key={flag.type}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-jetbrains), monospace',
                    }}
                  >
                    {flag.type}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {flag.detail}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: 'var(--color-severity-critical)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  +{flag.score}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-border-subtle)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor:
                      flag.score >= 25
                        ? 'var(--color-severity-critical)'
                        : flag.score >= 20
                        ? 'var(--color-severity-high)'
                        : 'var(--color-severity-medium)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
