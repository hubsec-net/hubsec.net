'use client';

import { useState } from 'react';
import { TracePanel } from './TracePanel';
import { RiskPanel } from './RiskPanel';
import { FundFlowPanel } from './FundFlowPanel';

const tabs = [
  { id: 'trace', label: 'Trace' },
  { id: 'risk', label: 'Risk' },
  { id: 'flow', label: 'Flow' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function ForensicsDemo() {
  const [activeTab, setActiveTab] = useState<TabId>('trace');

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* Demo header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-tertiary)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            HubSec Forensics
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-accent-muted)',
              color: 'var(--color-accent-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            Preview
          </span>
        </div>
        <span
          className="text-xs"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          Hyperbridge ISMP — Apr 13, 2026
        </span>
      </div>

      {/* Tab bar */}
      <div
        className="flex"
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2.5 text-xs font-medium transition-colors duration-150"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              color:
                activeTab === tab.id
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-text-tertiary)',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid var(--color-accent-primary)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor:
                activeTab === tab.id
                  ? 'var(--color-accent-primary)'
                  : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'trace' && <TracePanel />}
        {activeTab === 'risk' && <RiskPanel />}
        {activeTab === 'flow' && <FundFlowPanel />}
      </div>
    </div>
  );
}
