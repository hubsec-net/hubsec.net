import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { ReportMeta } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/research');

export async function getReports(): Promise<ReportMeta[]> {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

  const reports: ReportMeta[] = files.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    const source = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(source);

    return {
      slug: data.slug || filename.replace('.mdx', ''),
      title: data.title || '',
      subtitle: data.subtitle,
      date: data.date || '',
      classification: data.classification || 'info',
      category: data.category || 'post-mortem',
      categoryLabel: data.categoryLabel || 'Post-Mortem Analysis',
      status: data.status || '',
      reportId: data.reportId || '',
      summary: data.summary || '',
      tags: data.tags || [],
    };
  });

  // Sort by date descending
  reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return reports;
}

export async function getReportBySlug(slug: string) {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

  for (const filename of files) {
    const filePath = path.join(CONTENT_DIR, filename);
    const source = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(source);

    const fileSlug = data.slug || filename.replace('.mdx', '');
    if (fileSlug === slug) {
      return {
        meta: {
          slug: fileSlug,
          title: data.title || '',
          subtitle: data.subtitle,
          date: data.date || '',
          classification: data.classification || 'info',
          category: data.category || 'post-mortem',
          categoryLabel: data.categoryLabel || 'Post-Mortem Analysis',
          status: data.status || '',
          reportId: data.reportId || '',
          summary: data.summary || '',
          tags: data.tags || [],
        } as ReportMeta,
        content,
      };
    }
  }

  return null;
}

export async function getAllSlugs(): Promise<string[]> {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

  return files.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    const source = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(source);
    return data.slug || filename.replace('.mdx', '');
  });
}
