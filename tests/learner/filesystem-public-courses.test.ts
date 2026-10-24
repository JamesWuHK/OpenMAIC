import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  isAllowlistedLearnerCourseId,
  listFilesystemPublishedCourses,
} from '@/lib/learner/filesystem-public-courses';

const temporaryDirectories: string[] = [];

async function temporaryClassroomsDir(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'openmaic-learner-catalog-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function temporaryCatalogPath(directory: string): Promise<string> {
  const catalogPath = path.join(directory, 'published-courses.json');
  await writeFile(
    catalogPath,
    JSON.stringify({
      courses: [
        {
          id: 'hk-a01-02-leaf-classifier',
          description: '由圖片分類遊戲出發。',
          publishedAt: 1788798600000,
          topics: ['ai-tech', 'interests'],
          audiences: ['primary', 'secondary'],
          gradeRange: '小四至中一',
          language: 'zh-hk',
          series: '香港 AI 素養',
          lessonNumber: 2,
        },
      ],
    }),
  );
  return catalogPath;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('filesystem learner course catalog', () => {
  it('uses the catalog as the media and classroom allowlist', async () => {
    const directory = await temporaryClassroomsDir();
    const catalogPath = await temporaryCatalogPath(directory);
    await expect(
      isAllowlistedLearnerCourseId('hk-a01-02-leaf-classifier', catalogPath),
    ).resolves.toBe(true);
    await expect(isAllowlistedLearnerCourseId('draft-course', catalogPath)).resolves.toBe(false);
    await expect(isAllowlistedLearnerCourseId('../draft-course', catalogPath)).resolves.toBe(false);
  });

  it('returns only allowlisted classroom files that are present and valid', async () => {
    const directory = await temporaryClassroomsDir();
    const catalogPath = await temporaryCatalogPath(directory);
    await writeFile(
      path.join(directory, 'hk-a01-02-leaf-classifier.json'),
      JSON.stringify({
        id: 'hk-a01-02-leaf-classifier',
        createdAt: '2026-09-07T10:00:00Z',
        stage: {
          name: '機器怎樣認出一片葉子？',
          updatedAt: 1788776698942,
        },
        scenes: [{ id: 'one' }, { id: 'two' }],
      }),
    );
    await writeFile(
      path.join(directory, 'draft-course.json'),
      JSON.stringify({
        id: 'draft-course',
        stage: { name: 'Draft' },
        scenes: [{ id: 'draft' }],
      }),
    );

    await expect(listFilesystemPublishedCourses(directory, catalogPath)).resolves.toEqual([
      expect.objectContaining({
        id: 'hk-a01-02-leaf-classifier',
        name: '機器怎樣認出一片葉子？',
        sceneCount: 2,
        topics: ['ai-tech', 'interests'],
        audiences: ['primary', 'secondary'],
        gradeRange: '小四至中一',
        language: 'zh-hk',
        series: '香港 AI 素養',
        lessonNumber: 2,
      }),
    ]);
  });

  it('changes the public catalog at runtime without changing application code', async () => {
    const directory = await temporaryClassroomsDir();
    const catalogPath = await temporaryCatalogPath(directory);
    await writeFile(
      path.join(directory, 'new-course.json'),
      JSON.stringify({ id: 'new-course', stage: { name: '新課堂' }, scenes: [] }),
    );
    await writeFile(
      catalogPath,
      JSON.stringify({
        courses: [
          {
            id: 'new-course',
            description: '運行時發佈的課堂。',
            publishedAt: 1,
            topics: ['ai-tech'],
            audiences: ['primary'],
            gradeRange: '小四至小六',
            language: 'zh-hk',
            series: '測試系列',
            lessonNumber: 1,
          },
        ],
      }),
    );

    await expect(listFilesystemPublishedCourses(directory, catalogPath)).resolves.toEqual([
      expect.objectContaining({ id: 'new-course', name: '新課堂' }),
    ]);
  });
});
