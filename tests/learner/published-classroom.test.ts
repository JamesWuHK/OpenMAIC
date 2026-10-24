import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { readPublishedClassroom } from '@/lib/learner/published-classroom';

const directories: string[] = [];

async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'openmaic-learner-document-'));
  directories.push(directory);
  const catalogPath = path.join(directory, 'published-courses.json');
  await writeFile(
    catalogPath,
    JSON.stringify({
      courses: [
        {
          id: 'published-lesson',
          description: '課堂',
          publishedAt: 1,
          topics: ['ai-tech'],
          audiences: ['primary'],
          gradeRange: '小四至中一',
          language: 'zh-hk',
          series: '香港 AI 素養',
          lessonNumber: 1,
        },
      ],
    }),
  );
  await writeFile(
    path.join(directory, 'published-lesson.json'),
    JSON.stringify({
      id: 'published-lesson',
      stage: { id: 'published-lesson', name: '第一版', createdAt: 1, updatedAt: 1 },
      scenes: [
        {
          id: 'one',
          stageId: 'published-lesson',
          title: '第一頁',
          order: 0,
          type: 'slide',
          content: { type: 'slide', canvas: { id: 'canvas-one', elements: [] } },
        },
      ],
    }),
  );
  await writeFile(
    path.join(directory, 'draft-lesson.json'),
    JSON.stringify({
      id: 'draft-lesson',
      stage: { id: 'draft-lesson', name: '草稿', createdAt: 1, updatedAt: 1 },
      scenes: [],
    }),
  );
  return { directory, catalogPath };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('published learner classroom', () => {
  it('reads only an allowlisted classroom', async () => {
    const { directory, catalogPath } = await fixture();
    await expect(
      readPublishedClassroom('published-lesson', directory, catalogPath),
    ).resolves.toMatchObject({
      stage: { id: 'published-lesson', name: '第一版' },
      scenes: [{ id: 'one' }],
      outline: { generationComplete: true },
      sourceSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    await expect(
      readPublishedClassroom('draft-lesson', directory, catalogPath),
    ).resolves.toBeNull();
    await expect(
      readPublishedClassroom('../draft-lesson', directory, catalogPath),
    ).resolves.toBeNull();
  });

  it('reflects a same-ID content update without a database import', async () => {
    const { directory, catalogPath } = await fixture();
    await writeFile(
      path.join(directory, 'published-lesson.json'),
      JSON.stringify({
        id: 'published-lesson',
        stage: { id: 'published-lesson', name: '第二版', createdAt: 1, updatedAt: 2 },
        scenes: [
          {
            id: 'one',
            stageId: 'published-lesson',
            title: '第一頁',
            order: 0,
            type: 'slide',
            content: { type: 'slide', canvas: { id: 'canvas-one', elements: [] } },
          },
          {
            id: 'two',
            stageId: 'published-lesson',
            title: '第二頁',
            order: 1,
            type: 'slide',
            content: { type: 'slide', canvas: { id: 'canvas-two', elements: [] } },
          },
        ],
      }),
    );
    await expect(
      readPublishedClassroom('published-lesson', directory, catalogPath),
    ).resolves.toMatchObject({
      stage: { id: 'published-lesson', name: '第二版' },
      scenes: [{ id: 'one' }, { id: 'two' }],
      outline: { generationComplete: true },
    });
  });
});
