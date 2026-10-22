import { z } from 'zod';

import { LEARNER_COURSE_TOPICS } from './public-courses';

export const LEARNER_AGE_BANDS = [
  'lower-primary',
  'upper-primary',
  'junior-secondary',
  'senior-secondary',
  'adult',
] as const;

const learnerTopicSchema = z.object({
  id: z.enum(LEARNER_COURSE_TOPICS),
  title: z.string().min(1),
  description: z.string().min(1),
  accent: z.string().min(1),
  wash: z.string().min(1),
});

const learnerAgeSchema = z.object({
  id: z.enum(LEARNER_AGE_BANDS),
  title: z.string().min(1),
  description: z.string().min(1),
});

const learnerHeroSchema = z.object({
  image: z.string().startsWith('/'),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

const learnerSourceSchema = z.object({
  id: z.string().min(1),
  organisation: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  use: z.string().min(1),
  reviewedAt: z.iso.date(),
});

const learnerSeriesLessonSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  question: z.string().min(1),
  summary: z.string().min(1),
  outcome: z.string().min(1),
});

const learnerSeriesSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  question: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  language: z.string().min(1),
  languages: z.array(z.string().min(1)).min(1),
  ageBands: z.array(z.enum(LEARNER_AGE_BANDS)).min(1),
  topics: z.array(z.enum(LEARNER_COURSE_TOPICS)).min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  lessonCount: z.number().int().positive(),
  minutesPerLesson: z.string().min(1),
  finalArtifact: z.string().min(1),
  status: z.enum(['open', 'preview', 'planning']),
  sourceIds: z.array(z.string().min(1)).min(1),
  liveCourseIds: z.array(z.string().min(1)).optional(),
  signal: z.string().min(1),
  heroImage: z.string().startsWith('/').optional(),
  promoHeadline: z.string().min(1).optional(),
  introduction: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)).optional(),
  lessons: z.array(learnerSeriesLessonSchema).optional(),
});

const originalContentPolicySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  rules: z.array(z.string().min(1)).min(1),
});

const standardsAlignmentSchema = z.object({
  title: z.string().min(1),
  framework: z.string().min(1),
  description: z.string().min(1),
});

export const learnerSiteContentSchema = z
  .object({
    hero: learnerHeroSchema,
    topics: z.array(learnerTopicSchema).length(LEARNER_COURSE_TOPICS.length),
    ageBands: z.array(learnerAgeSchema).length(LEARNER_AGE_BANDS.length),
    sources: z.array(learnerSourceSchema).min(1),
    series: z.array(learnerSeriesSchema).min(1),
    originalContentPolicy: originalContentPolicySchema,
    standardsAlignment: z.array(standardsAlignmentSchema).min(1),
  })
  .superRefine((content, context) => {
    const topicIds = content.topics.map((topic) => topic.id);
    if (new Set(topicIds).size !== topicIds.length) {
      context.addIssue({ code: 'custom', path: ['topics'], message: 'Topic IDs must be unique' });
    }

    const ageIds = content.ageBands.map((age) => age.id);
    if (new Set(ageIds).size !== ageIds.length) {
      context.addIssue({ code: 'custom', path: ['ageBands'], message: 'Age IDs must be unique' });
    }

    const sourceIds = new Set(content.sources.map((source) => source.id));
    if (sourceIds.size !== content.sources.length) {
      context.addIssue({ code: 'custom', path: ['sources'], message: 'Source IDs must be unique' });
    }

    const seriesSlugs = content.series.map((series) => series.slug);
    if (new Set(seriesSlugs).size !== seriesSlugs.length) {
      context.addIssue({
        code: 'custom',
        path: ['series'],
        message: 'Series slugs must be unique',
      });
    }

    content.series.forEach((series, seriesIndex) => {
      series.sourceIds.forEach((sourceId, sourceIndex) => {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            path: ['series', seriesIndex, 'sourceIds', sourceIndex],
            message: `Unknown source ID: ${sourceId}`,
          });
        }
      });

      if (series.lessons && series.lessons.length !== series.lessonCount) {
        context.addIssue({
          code: 'custom',
          path: ['series', seriesIndex, 'lessons'],
          message: 'Lesson outline length must match lessonCount',
        });
      }
    });
  });

export type LearnerSiteContent = z.infer<typeof learnerSiteContentSchema>;
export type LearnerAgeBand = (typeof LEARNER_AGE_BANDS)[number];
export type LearnerTopicDefinition = LearnerSiteContent['topics'][number];
export type LearnerAgeDefinition = LearnerSiteContent['ageBands'][number];
export type LearnerSourceDefinition = LearnerSiteContent['sources'][number];
export type LearnerSeriesDefinition = LearnerSiteContent['series'][number];
export type LearnerSeriesLesson = NonNullable<LearnerSeriesDefinition['lessons']>[number];
