import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type {
  LearnerCourseSummary,
} from './public-courses';
import {
  LEARNER_COURSE_AUDIENCES,
  LEARNER_COURSE_LANGUAGES,
  LEARNER_COURSE_TOPICS,
} from './public-courses';

const filesystemCourseDefinitionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.number().finite(),
  topics: z.array(z.enum(LEARNER_COURSE_TOPICS)).min(1),
  audiences: z.array(z.enum(LEARNER_COURSE_AUDIENCES)).min(1),
  gradeRange: z.string().min(1),
  language: z.enum(LEARNER_COURSE_LANGUAGES),
  series: z.string().min(1),
  lessonNumber: z.number().int().positive(),
});

const filesystemCourseCatalogSchema = z.object({
  courses: z.array(filesystemCourseDefinitionSchema),
});

type FilesystemCourseDefinition = z.infer<typeof filesystemCourseDefinitionSchema>;

interface FilesystemClassroom {
  readonly id?: unknown;
  readonly createdAt?: unknown;
  readonly stage?: {
    readonly name?: unknown;
    readonly description?: unknown;
    readonly createdAt?: unknown;
    readonly updatedAt?: unknown;
    readonly interactiveMode?: unknown;
    readonly taskEngineMode?: unknown;
  };
  readonly scenes?: unknown;
}

export const DEFAULT_LEARNER_PUBLISHED_COURSES_PATH = path.join(
  process.cwd(),
  'content',
  'learner',
  'published-courses.json',
);

export function learnerPublishedCoursesPath(): string {
  return (
    process.env.LEARNER_PUBLISHED_COURSES_PATH?.trim() ||
    DEFAULT_LEARNER_PUBLISHED_COURSES_PATH
  );
}

async function readPublishedCourseDefinitions(
  catalogPath = learnerPublishedCoursesPath(),
): Promise<FilesystemCourseDefinition[]> {
  const raw = await readFile(catalogPath, 'utf8');
  return filesystemCourseCatalogSchema.parse(JSON.parse(raw)).courses;
}

function timestamp(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Minimal public catalog for a stateless learner deployment.
 *
 * The explicit allowlist is the publication boundary: draft JSON files placed
 * beside these classrooms never appear on the learner homepage by accident.
 */
export async function listFilesystemPublishedCourses(
  classroomsDir = path.join(process.cwd(), 'data', 'classrooms'),
  catalogPath = learnerPublishedCoursesPath(),
): Promise<LearnerCourseSummary[]> {
  const definitions = await readPublishedCourseDefinitions(catalogPath);
  const courses = await Promise.all(
    definitions.map(async (definition): Promise<LearnerCourseSummary | null> => {
      const classroomPath = path.join(classroomsDir, `${definition.id}.json`);
      try {
        const classroom = JSON.parse(await readFile(classroomPath, 'utf8')) as FilesystemClassroom;
        if (
          classroom.id !== definition.id ||
          typeof classroom.stage?.name !== 'string' ||
          !Array.isArray(classroom.scenes)
        ) {
          return null;
        }

        const createdAt = timestamp(
          classroom.createdAt ?? classroom.stage.createdAt,
          definition.publishedAt,
        );
        const updatedAt = timestamp(classroom.stage.updatedAt, createdAt);
        return {
          id: definition.id,
          name: classroom.stage.name,
          description:
            typeof classroom.stage.description === 'string'
              ? classroom.stage.description
              : definition.description,
          topics: definition.topics,
          audiences: definition.audiences,
          gradeRange: definition.gradeRange,
          language: definition.language,
          series: definition.series,
          lessonNumber: definition.lessonNumber,
          ...(typeof classroom.stage.interactiveMode === 'boolean'
            ? { interactiveMode: classroom.stage.interactiveMode }
            : {}),
          ...(typeof classroom.stage.taskEngineMode === 'boolean'
            ? { taskEngineMode: classroom.stage.taskEngineMode }
            : {}),
          createdAt,
          updatedAt,
          sceneCount: classroom.scenes.length,
          publishedAt: definition.publishedAt,
        } satisfies LearnerCourseSummary;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    }),
  );

  return courses.filter((course): course is LearnerCourseSummary => course !== null);
}
