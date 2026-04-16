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

