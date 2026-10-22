import { describe, expect, it, vi } from 'vitest';

import { listPublishedCourses } from '@/lib/learner/public-courses';

describe('published learner course catalog', () => {
  it('returns only the public, complete course summary fields in publication order', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'course-1',
          name: 'Hong Kong Stories',
          description: 'Learn with an AI classroom',
          interactive_mode: true,
          task_engine_mode: null,
          created_at: '1700000000000',
          updated_at: 1700000001000,
          scene_count: '8',
          published_at: '1700000002000',
        },
      ],
    });

    await expect(listPublishedCourses({ query })).resolves.toEqual([
      {
        id: 'course-1',
        name: 'Hong Kong Stories',
        description: 'Learn with an AI classroom',
        interactiveMode: true,
        createdAt: 1700000000000,
        updatedAt: 1700000001000,
        sceneCount: 8,
        publishedAt: 1700000002000,
      },
    ]);

    expect(query).toHaveBeenCalledOnce();
    const sql = query.mock.calls[0]![0] as string;
    expect(sql).toContain('meta.is_public = true');
    expect(sql).toContain('meta.deleted_at IS NULL');
    expect(sql).toContain('meta.generation_complete = true');
    expect(sql).toContain('ORDER BY meta.published_at DESC');
    expect(sql).not.toContain('owner_id AS');
  });

  it('adds reviewed language and grade metadata to the current Hong Kong lessons', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'codex-zh-hk-audio-smoke',
          name: '甚麼是人工智能？',
          description: null,
          interactive_mode: true,
          task_engine_mode: null,
          created_at: 1,
          updated_at: 2,
          scene_count: '6',
          published_at: 3,
        },
      ],
    });

    await expect(listPublishedCourses({ query })).resolves.toEqual([
      expect.objectContaining({
        id: 'codex-zh-hk-audio-smoke',
        gradeRange: '小四至中一',
        language: 'zh-hk',
        series: '香港 AI 素養',
        lessonNumber: 1,
      }),
    ]);
  });
});
