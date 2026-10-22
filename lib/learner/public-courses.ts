export const LEARNER_COURSE_TOPICS = [
  'ai-tech',
  'chinese',
  'hong-kong',
  'leadership',
  'life-money',
  'interests',
] as const;

export const LEARNER_COURSE_AUDIENCES = ['primary', 'secondary', 'adult'] as const;

export const LEARNER_COURSE_LANGUAGES = ['zh-hk', 'zh-cn', 'en'] as const;

export type LearnerCourseTopic = (typeof LEARNER_COURSE_TOPICS)[number];
export type LearnerCourseAudience = (typeof LEARNER_COURSE_AUDIENCES)[number];
export type LearnerCourseLanguage = (typeof LEARNER_COURSE_LANGUAGES)[number];

export interface LearnerCourseSummary {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly topics?: readonly LearnerCourseTopic[];
  readonly audiences?: readonly LearnerCourseAudience[];
  readonly gradeRange?: string;
  readonly language?: LearnerCourseLanguage;
  readonly series?: string;
  readonly lessonNumber?: number;
  readonly interactiveMode?: boolean;
  readonly taskEngineMode?: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly sceneCount: number;
  readonly publishedAt: number;
}

export interface LearnerCourseQueryable {
  query<TRow extends Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: TRow[] }>;
}

interface LearnerCourseRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  interactive_mode: boolean | null;
  task_engine_mode: boolean | null;
  created_at: number | string;
  updated_at: number | string;
  scene_count: number | string;
  published_at: number | string;
}

const CURATED_COURSE_DETAILS: Readonly<
  Record<
    string,
    Pick<
      LearnerCourseSummary,
      'topics' | 'audiences' | 'gradeRange' | 'language' | 'series' | 'lessonNumber'
    >
  >
> = {
  'codex-zh-hk-audio-smoke': {
    topics: ['ai-tech'],
    audiences: ['primary', 'secondary'],
    gradeRange: '小四至中一',
    language: 'zh-hk',
    series: '香港 AI 素養',
    lessonNumber: 1,
  },
  'hk-a01-02-leaf-classifier': {
    topics: ['ai-tech', 'interests'],
    audiences: ['primary', 'secondary'],
    gradeRange: '小四至中一',
    language: 'zh-hk',
    series: '香港 AI 素養',
    lessonNumber: 2,
  },
};

export function curatedLearnerCourseDetails(courseId: string) {
  return CURATED_COURSE_DETAILS[courseId];
}

/** Public discovery deliberately exposes no owner or folder identity. */
export async function listPublishedCourses(
  queryable: LearnerCourseQueryable,
): Promise<LearnerCourseSummary[]> {
  const result = await queryable.query<LearnerCourseRow>(`
    SELECT stages.id,
           stages.name,
           stages.description,
           stages.interactive_mode,
           stages.task_engine_mode,
           stages.created_at,
           stages.updated_at,
           COUNT(scenes.id)::text AS scene_count,
           meta.published_at
      FROM document_stages AS stages
      JOIN stage_meta AS meta ON meta.stage_id = stages.id
      LEFT JOIN document_scenes AS scenes ON scenes.stage_id = stages.id
     WHERE meta.is_public = true
       AND meta.deleted_at IS NULL
       AND meta.generation_complete = true
     GROUP BY stages.id, meta.published_at
     ORDER BY meta.published_at DESC, stages.updated_at DESC, stages.id ASC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    ...(row.description === null ? {} : { description: row.description }),
    ...(row.interactive_mode === null ? {} : { interactiveMode: row.interactive_mode }),
    ...(row.task_engine_mode === null ? {} : { taskEngineMode: row.task_engine_mode }),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    sceneCount: Number(row.scene_count),
    publishedAt: Number(row.published_at),
    ...curatedLearnerCourseDetails(row.id),
  }));
}
