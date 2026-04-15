import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getReportBySlug, getAllSlugs } from '@/lib/mdx';
import { SITE_NAME } from '@/lib/constants';
import { TableOfContents } from '@/components/layout/TableOfContents';
import { ReportHeader } from '@/components/report/ReportHeader';
import { KeyIdentifiers } from '@/components/report/KeyIdentifiers';
import { Timeline } from '@/components/report/Timeline';
import { FundFlow } from '@/components/report/FundFlow';
import { DetectionTable } from '@/components/report/DetectionTable';
import { ImpactTable } from '@/components/report/ImpactTable';
import { SimilarIncidents } from '@/components/report/SimilarIncidents';
import { ReportFooter } from '@/components/report/ReportFooter';

// Import content hashes (decoupled from MDX so the hash isn't part of the hashed content)
import reportHashes from '@/content/hashes.json';

// Import structured report data
import {
  keyIdentifiers,
  timelineEvents,
  fundFlowNodes,
  fundFlowEdges,
  detections,
  impactData,
  similarIncidents,
} from '@/content/research/hyperbridge-2026-04.data';

// Map of slug -> structured data for rendering components between prose sections
const reportData: Record<string, {
  keyIdentifiers: typeof keyIdentifiers;
  timelineEvents: typeof timelineEvents;
  fundFlowNodes: typeof fundFlowNodes;
  fundFlowEdges: typeof fundFlowEdges;
  detections: typeof detections;
  impactData: typeof impactData;
  similarIncidents: typeof similarIncidents;
}> = {
  'hyperbridge-2026-04': {
    keyIdentifiers,
    timelineEvents,
    fundFlowNodes,
    fundFlowEdges,
    detections,
    impactData,
    similarIncidents,
  },
};

const tocItems = [
  { id: 'executive-summary', title: 'Executive Summary', level: 2 },
  { id: 'key-identifiers', title: 'Key Identifiers', level: 2 },
  { id: 'attacker-profile', title: 'Attacker Profile', level: 2 },
  { id: 'attack-timeline', title: 'Attack Timeline', level: 2 },
  { id: 'fund-flow-analysis', title: 'Fund Flow Analysis', level: 2 },
  { id: 'root-cause-analysis', title: 'Root Cause Analysis', level: 2 },
  { id: 'impact-assessment', title: 'Impact Assessment', level: 2 },
  { id: 'detection-analysis', title: 'Detection Analysis', level: 2 },
  { id: 'recommendations', title: 'Recommendations', level: 2 },
  { id: 'similar-historical-incidents', title: 'Similar Incidents', level: 2 },
  { id: 'methodology', title: 'Methodology', level: 2 },
];

const mdxComponents = {
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
    const id = String(children)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return (
      <h2
        id={id}
        className="text-xl md:text-2xl font-bold mt-12 mb-4 pt-4"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-primary)',
          scrollMarginTop: '80px',
        }}
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => {
    const id = String(children)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return (
      <h3
        id={id}
        className="text-lg font-semibold mt-8 mb-3"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-primary)',
          scrollMarginTop: '80px',
        }}
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p
      className="mb-4 text-base leading-relaxed"
      style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-4 ml-6 list-disc" style={{ color: 'var(--color-text-secondary)' }} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-4 ml-6 list-decimal" style={{ color: 'var(--color-text-secondary)' }} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="mb-1 text-base" style={{ lineHeight: 'var(--leading-relaxed)' }} {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong style={{ color: 'var(--color-text-primary)' }} {...props}>
      {children}
    </strong>
  ),
  a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) => {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{ color: 'var(--color-accent-primary)' }}
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="my-4 pl-4"
      style={{
        borderLeft: '3px solid var(--color-accent-primary)',
        color: 'var(--color-text-secondary)',
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    // Fenced code blocks get className like "language-solidity"
    if (className) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded text-sm"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-accent-primary)',
          fontFamily: 'var(--font-jetbrains), monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
};

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await getReportBySlug(slug);
  if (!report) return { title: 'Report Not Found' };

  return {
    title: `${report.meta.title} | ${SITE_NAME}`,
    description: report.meta.summary,
    openGraph: {
      title: `${report.meta.title} | ${SITE_NAME}`,
      description: report.meta.summary,
      type: 'article',
      publishedTime: report.meta.date,
    },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = await getReportBySlug(slug);

  if (!report) {
    notFound();
  }

  const data = reportData[slug];

  // Split MDX content at section headers to interleave with data components
  const sections = splitMdxBySections(report.content);

  return (
    <article className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex gap-12">
          {/* Sidebar TOC (desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
            </div>
          </aside>

          {/* Main content */}
          <div className="report-content flex-1 min-w-0 max-w-3xl">
            {/* Report Header */}
            <ReportHeader
              title={report.meta.title}
              date={report.meta.date}
              classification={report.meta.classification}
              category={report.meta.tags?.join(' / ') || report.meta.categoryLabel}
              status={report.meta.status}
              reportId={report.meta.reportId}
            />

            {/* Render sections with interleaved data components */}
            {sections.map((section, i) => (
              <div key={i} className="report-section">
                <MDXRemote
                  source={section.content}
                  components={mdxComponents}
                  options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                />

                {/* Insert data components after their matching section headers */}
                {data && section.id === 'key-identifiers' && (
                  <KeyIdentifiers data={data.keyIdentifiers} />
                )}
                {data && section.id === 'attack-timeline' && (
                  <Timeline events={data.timelineEvents} />
                )}
                {data && section.id === 'fund-flow-analysis' && (
                  <FundFlow nodes={data.fundFlowNodes} edges={data.fundFlowEdges} />
                )}
                {data && section.id === 'impact-assessment' && (
                  <ImpactTable data={data.impactData} />
                )}
                {data && section.id === 'detection-analysis' && (
                  <DetectionTable detections={data.detections} />
                )}
                {data && section.id === 'similar-historical-incidents' && (
                  <SimilarIncidents incidents={data.similarIncidents} />
                )}
              </div>
            ))}

            {/* Report Footer */}
            {data && (
              <ReportFooter
                reportId={report.meta.reportId}
                confidence="high"
                hashEntry={(reportHashes as Record<string, { sha256: string; signed: boolean; date: string }>)[slug]}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Split MDX content into sections based on ## headings */
function splitMdxBySections(content: string): { id: string; content: string }[] {
  const lines = content.split('\n');
  const sections: { id: string; lines: string[] } = { id: 'intro', lines: [] };
  const result: { id: string; content: string }[] = [];
  let current = sections;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match || h3Match) {
      // Save previous section
      if (current.lines.length > 0) {
        result.push({
          id: current.id,
          content: current.lines.join('\n'),
        });
      }
      const title = h2Match ? h2Match[1] : h3Match![1];
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      current = { id, lines: [line] };
    } else {
      current.lines.push(line);
    }
  }

  // Push last section
  if (current.lines.length > 0) {
    result.push({
      id: current.id,
      content: current.lines.join('\n'),
    });
  }

  return result;
}
