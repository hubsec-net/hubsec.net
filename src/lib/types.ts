export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReportCategory = 'post-mortem' | 'vulnerability-research' | 'advisory';

export interface ReportMeta {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  classification: SeverityLevel;
  category: ReportCategory;
  categoryLabel: string;
  status: string;
  reportId: string;
  summary: string;
  tags: string[];
}

export interface KeyIdentifier {
  label: string;
  value: string;
  link?: string;
  copyable?: boolean;
}

export interface TimelineEvent {
  date: string;
  phase: 'preparation' | 'execution' | 'extraction' | 'aftermath';
  title: string;
  description: string;
}

export interface FundFlowNode {
  id: string;
  label: string;
  type: 'source' | 'contract' | 'attacker' | 'exit' | 'dex';
  x?: number;
  y?: number;
}

export interface FundFlowEdge {
  from: string;
  to: string;
  label: string;
  phase: 'funding' | 'exploit' | 'exit';
}

export interface Detection {
  module: string;
  rule: string;
  description?: string;
  leadTime: string;
}

export interface ImpactItem {
  category: string;
  value: string;
}

export interface SimilarIncident {
  name: string;
  date: string;
  loss: string;
  similarity: string;
}
