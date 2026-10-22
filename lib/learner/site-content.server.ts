import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { learnerSiteContentSchema, type LearnerSiteContent } from './site-content';

export const DEFAULT_LEARNER_SITE_CONTENT_PATH = path.join(
  process.cwd(),
  'content',
  'learner',
  'site-content.json',
);

export function learnerSiteContentPath(): string {
  return process.env.LEARNER_SITE_CONTENT_PATH?.trim() || DEFAULT_LEARNER_SITE_CONTENT_PATH;
}

export async function readLearnerSiteContent(
  contentPath = learnerSiteContentPath(),
): Promise<LearnerSiteContent> {
  const raw = await readFile(contentPath, 'utf8');
  return learnerSiteContentSchema.parse(JSON.parse(raw));
}

export async function getLearnerSeries(slug: string) {
  const content = await readLearnerSiteContent();
  return content.series.find((series) => series.slug === slug);
}
