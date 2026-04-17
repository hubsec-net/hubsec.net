import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getReportBySlug, getAllSlugs } from '@/lib/mdx';
import { SITE_NAME } from '@/lib/constants';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportFooter } from '@/components/report/ReportFooter';
import reportHashes from '@/content/hashes.json';

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
      className="mb-4 text-base"
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
  em: ({ children, ...props }: React.ComponentPropsWithoutRef<'em'>) => (
    <em style={{ color: 'var(--color-text-tertiary)' }} {...props}>
      {children}
    </em>
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
  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
    <hr
      className="my-10"
      style={{
        border: 'none',
        borderTop: '1px solid var(--color-border-default)',
      }}
      {...props}
    />
  ),
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{
          borderCollapse: 'collapse',
          border: '1px solid var(--color-border-default)',
          fontFamily: 'var(--font-jetbrains), monospace',
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => (
    <thead
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-default)',
      }}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.ComponentPropsWithoutRef<'tbody'>) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr
      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th
      className="px-4 py-3 text-left text-xs uppercase"
      style={{
        color: 'var(--color-text-tertiary)',
        letterSpacing: 'var(--tracking-wide)',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td
      className="px-4 py-3 align-top"
      style={{
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}
      {...props}
    >
      {children}
    </td>
  ),
  pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="my-6 overflow-x-auto p-4 rounded-md text-sm"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        fontFamily: 'var(--font-jetbrains), monospace',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    if (className) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
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

export const dynamicParams = false;

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

  const hashEntry = (reportHashes as Record<string, { sha256: string; signed: boolean; date: string }>)[slug];

  return (
    <article className="py-12">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="report-content">
          <ReportHeader
            title={report.meta.title}
            date={report.meta.date}
            classification={report.meta.classification}
            category={report.meta.categoryLabel}
            reportCategory={report.meta.category}
            status={report.meta.status}
            reportId={report.meta.reportId}
          />

          <MDXRemote
            source={report.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />

          <ReportFooter
            reportId={report.meta.reportId}
            confidence="high"
            hashEntry={hashEntry}
          />
        </div>
      </div>
    </article>
  );
}
