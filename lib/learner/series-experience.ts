import type { LearnerSeriesDefinition } from './site-content';

export function getSeriesExperienceHref(series: LearnerSeriesDefinition): string {
  const liveCourseId = series.liveCourseIds?.[0];
  return liveCourseId ? `/classroom/${liveCourseId}` : `/experience/${series.slug}`;
}

export function getFirstLessonTitle(series: LearnerSeriesDefinition): string {
  return series.lessons?.[0]?.title ?? `第 1 課：${series.question}`;
}

export function getSeriesLessonHref(
  series: LearnerSeriesDefinition,
  lessonNumber: number,
): string {
  const liveCourseId = series.liveCourseIds?.[lessonNumber - 1];
  if (liveCourseId) return `/classroom/${liveCourseId}`;
  if (lessonNumber === 1) return `/experience/${series.slug}`;
  return `/series/${series.slug}/lessons/${lessonNumber}`;
}

export function isSeriesLessonOpen(
  series: LearnerSeriesDefinition,
  lessonNumber: number,
): boolean {
  return lessonNumber === 1 || Boolean(series.liveCourseIds?.[lessonNumber - 1]);
}
