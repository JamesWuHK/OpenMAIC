import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { OPENMAIC_MIT_LICENSE, OPEN_SOURCE_COMPONENTS } from '@/lib/legal/open-source-notices';

const root = process.cwd();

describe('learner open-source notices', () => {
  it('preserves the OpenMAIC MIT copyright and permission notice', () => {
    expect(OPENMAIC_MIT_LICENSE).toContain('Copyright (c) 2026 THU-MAIC');
    expect(OPENMAIC_MIT_LICENSE).toContain(
      'The above copyright notice and this permission notice shall be included',
    );
  });

  it('lists the separately licensed workspace components called out upstream', () => {
    expect(OPEN_SOURCE_COMPONENTS.map(({ name, license }) => [name, license])).toEqual([
      ['OpenMAIC', 'MIT'],
      ['mathml2omml', 'LGPL-3.0-or-later'],
      ['PptxGenJS', 'MIT'],
    ]);
  });

  it('links the learner footer to the notice page without foreground OpenMAIC branding', async () => {
    const chrome = await readFile(`${root}/components/learner/learner-site-chrome.tsx`, 'utf8');
    expect(chrome).toContain('href="/open-source-licenses"');
    expect(chrome).not.toContain('OpenMAIC Open Source Project');
  });

  it('ships complete license text files with the public bundle', async () => {
    const openmaic = await readFile(`${root}/public/legal/licenses/openmaic-mit.txt`, 'utf8');
    const mathml = await readFile(`${root}/public/legal/licenses/mathml2omml-lgpl-3.0.txt`, 'utf8');
    const pptxgen = await readFile(`${root}/public/legal/licenses/pptxgenjs-mit.txt`, 'utf8');

    expect(openmaic).toContain('Copyright (c) 2026 THU-MAIC');
    expect(mathml).toContain('GNU LESSER GENERAL PUBLIC LICENSE');
    expect(pptxgen).toContain('Copyright (c) 2015-present Brent Ely');
  });
});
