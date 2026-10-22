import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { learnerSiteContentSchema } from '../lib/learner/site-content';

async function main() {
  const target = path.resolve(
    process.argv[2] ?? path.join('content', 'learner', 'site-content.json'),
  );
  const content = learnerSiteContentSchema.parse(JSON.parse(await readFile(target, 'utf8')));
  const languageSummary = [...new Set(content.series.flatMap((series) => series.languages))].join(
    '、',
  );

  console.log(
    `Validated ${path.relative(process.cwd(), target)}: ${content.series.length} series, ${content.sources.length} sources, languages: ${languageSummary}.`,
  );
}

void main();
