import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import rawContent from '@/content/learner/site-content.json';
import publishedCourses from '@/content/learner/published-courses.json';
import { getSeriesLessonHref } from '@/lib/learner/series-experience';
import { learnerSiteContentSchema } from '@/lib/learner/site-content';
import { LEARNER_COURSE_TOPICS } from '@/lib/learner/public-courses';

const content = learnerSiteContentSchema.parse(rawContent);

describe('learner site runtime content', () => {
  it('publishes a runtime-managed homepage hero and original cover for every series', () => {
    expect(content.hero.image).toBe('/learner/runtime/wanli-learning-hero-v2.webp');
    for (const series of content.series) {
      expect(series.heroImage).toMatch(/^\/learner\/runtime\/[a-z0-9-]+\.(webp|png|svg)$/);
      const file = path.join(process.cwd(), 'content/learner/media', path.basename(series.heroImage!));
      expect(existsSync(file), `${series.slug}: cover must actually exist`).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(0);
    }
  });

  it('keeps the six public topics aligned with course discovery metadata', () => {
    expect(content.topics.map((topic) => topic.id)).toEqual(LEARNER_COURSE_TOPICS);
    expect(new Set(content.topics.map((topic) => topic.id)).size).toBe(6);
  });

  it('gives every series a unique route and traceable research basis', () => {
    expect(new Set(content.series.map((series) => series.slug)).size).toBe(content.series.length);

    for (const series of content.series) {
      expect(series.language).toMatch(/正體中文|繁體中文/);
      expect(series.language).toContain('粵語');
      expect(series.languages).toEqual(['廣東話（香港粵語）']);
      expect(series.lessonCount).toBeGreaterThan(0);
      expect(series.capabilities.length).toBeGreaterThanOrEqual(3);
      expect(series.sourceIds.length).toBeGreaterThanOrEqual(2);
      expect(
        series.sourceIds.every((sourceId) =>
          content.sources.some((source) => source.id === sourceId),
        ),
      ).toBe(true);
      expect(
        series.ageBands.every((ageBand) =>
          content.ageBands.some((definition) => definition.id === ageBand),
        ),
      ).toBe(true);
    }
  });

  it('gives every series an open first-lesson experience', () => {
    for (const series of content.series) {
      const href = series.liveCourseIds?.[0]
        ? `/classroom/${series.liveCourseIds[0]}`
        : `/experience/${series.slug}`;
      expect(href).toMatch(/^\/(?:classroom|experience)\/[a-z0-9-]+$/);
    }
  });

  it('publishes a complete linked lesson directory for every series', () => {
    for (const series of content.series) {
      if (series.slug === 'nobel-curiosity-lab') {
        // Ordinary lectures use the published course cards as their directory.
        // Each card must exist and lead to its corresponding live classroom.
        expect(series.liveCourseIds).toHaveLength(series.lessonCount);
        expect(new Set(series.liveCourseIds).size).toBe(series.lessonCount);
        for (const [index, id] of series.liveCourseIds!.entries()) {
          const card = publishedCourses.courses.find((course) => course.id === id);
          expect(card, `${id}: missing published card`).toBeDefined();
          expect(card?.lessonNumber).toBe(index + 1);
          expect(card?.description.length).toBeGreaterThan(12);
          expect(getSeriesLessonHref(series, index + 1)).toBe(`/classroom/${id}`);
        }
        continue;
      }
      expect(series.lessons).toHaveLength(series.lessonCount);
      expect(series.lessons?.map((lesson) => lesson.number)).toEqual(
        Array.from({ length: series.lessonCount }, (_, index) => index + 1),
      );
      for (const lesson of series.lessons ?? []) {
        expect(getSeriesLessonHref(series, lesson.number)).toMatch(
          /^\/(?:classroom|experience|series)\/[a-z0-9-/]+$/,
        );
      }
    }
  });

  it('records review dates and safe official URLs for every research source', () => {
    expect(new Set(content.sources.map((source) => source.id)).size).toBe(content.sources.length);
    for (const source of content.sources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.use.length).toBeGreaterThan(12);
    }
  });

  it('makes rewriting and original visual production an explicit editorial rule', () => {
    expect(content.originalContentPolicy.summary).toContain('原創教學敘事');
    expect(content.originalContentPolicy.summary).toContain('符合授權條件');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('核實作者、來源與使用授權');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('不用改幾個字的方式仿寫原文');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('AI 生成');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('不暗示');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('獨立教育項目');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('原機構最新公布為準');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('R 標示可核實事實');
    expect(content.originalContentPolicy.rules.join('\n')).toContain('待查證');
  });

  it('publishes the persuasive Chinese preview as a complete six-lesson series', () => {
    const series = content.series.find((item) => item.slug === 'persuasive-chinese-hong-kong');

    expect(series).toBeDefined();
    expect(series?.status).toBe('open');
    expect(series?.heroImage).toBe('/learner/runtime/persuasive-chinese-hong-kong-cover.webp');
    expect(series?.promoHeadline).toContain('觀點站得住');
    expect(series?.introduction?.length).toBeGreaterThan(80);
    expect(series?.highlights).toHaveLength(4);
    expect(series?.lessons).toHaveLength(6);
    expect(series?.lessons?.map((lesson) => lesson.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(series?.lessons?.every((lesson) => lesson.outcome.length > 5)).toBe(true);
  });

  it('rejects a series that references a missing source', () => {
    const invalid = structuredClone(rawContent);
    invalid.series[0].sourceIds = ['missing-source'];

    expect(learnerSiteContentSchema.safeParse(invalid).success).toBe(false);
  });
});
