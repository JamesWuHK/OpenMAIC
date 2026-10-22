import {
  LEARNER_COURSE_AUDIENCES,
  LEARNER_COURSE_LANGUAGES,
  LEARNER_COURSE_TOPICS,
  type LearnerCourseAudience,
  type LearnerCourseLanguage,
  type LearnerCourseSummary,
  type LearnerCourseTopic,
} from './public-courses';

export type LearnerCourseFilter = 'all' | LearnerCourseTopic;

export interface LearnerHomeCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly titleLines: readonly [string, string];
  readonly description: string;
  readonly library: string;
  readonly libraryHint: string;
  readonly emptyTitle: string;
  readonly emptyHint: string;
  readonly loading: string;
  readonly retry: string;
  readonly openCourse: string;
  readonly lessonUnit: string;
  readonly aiTeacher: string;
  readonly aiAssistant: string;
  readonly aiClassmates: string;
  readonly exploreCourses: string;
  readonly allCourses: string;
  readonly courseSection: string;
  readonly courseSectionHint: string;
  readonly coursesAvailable: string;
  readonly comingSoon: string;
  readonly lessonLabel: string;
  readonly noCoursesForRoute: string;
  readonly openSourceNotices: string;
  readonly topicLabels: Readonly<Record<LearnerCourseTopic, string>>;
  readonly topicDescriptions: Readonly<Record<LearnerCourseTopic, string>>;
  readonly audienceLabels: Readonly<Record<LearnerCourseAudience, string>>;
  readonly languageLabels: Readonly<Record<LearnerCourseLanguage, string>>;
}

const ZH_HK_COPY: LearnerHomeCopy = {
  eyebrow: '香港出發 · AI 共學課堂',
  title: '把每個好奇心，變成一門課',
  titleLines: ['把每個好奇心，', '變成一門課'],
  description:
    '從熟悉的香港生活出發，和 AI 老師、助教與同學一起提問、判斷、動手做。每次學習，都通往一個真正能用的能力。',
  library: '選一條學習路線',
  libraryHint: '先選方向，再進入一節可以參與、可以思考、可以動手做的課。',
  emptyTitle: '課程正在準備中',
  emptyHint: '已發佈的香港課程會顯示在這裡。',
  loading: '正在載入課程…',
  retry: '重試',
  openCourse: '開始學習',
  lessonUnit: '個課堂場景',
  aiTeacher: 'AI 老師',
  aiAssistant: 'AI 助教',
  aiClassmates: 'AI 同學',
  exploreCourses: '探索學習路線',
  allCourses: '全部課程',
  courseSection: '正在開放的課程',
  courseSectionHint: '每一節都是一個完整主題，也會逐步連成系列。',
  coursesAvailable: '門課可學',
  comingSoon: '即將上線',
  lessonLabel: '第 {number} 課',
  noCoursesForRoute: '這條路線正在準備首批課程，先看看其他方向。',
  openSourceNotices: '開源軟件聲明',
  topicLabels: {
    'ai-tech': 'AI 科技',
    chinese: '中文表達',
    'hong-kong': '香港探索',
    leadership: '領導力與創業',
    'life-money': '財商與生活',
    interests: '興趣與創造',
  },
  topicDescriptions: {
    'ai-tech': '理解、使用與創造',
    chinese: '閱讀、寫作與溝通',
    'hong-kong': '城市、自然與文化',
    leadership: '協作、決策與行動',
    'life-money': '選擇、風險與責任',
    interests: '科學、藝術與想像',
  },
  audienceLabels: {
    primary: '小學高年級',
    secondary: '初中',
    adult: '成人',
  },
  languageLabels: {
    'zh-hk': '正體中文（香港） · 粵語講解',
    'zh-cn': '普通話',
    en: 'English',
  },
};

const EN_COPY: LearnerHomeCopy = {
  eyebrow: 'FROM HONG KONG · AI LEARNING STUDIO',
  title: 'Turn every curiosity into a course',
  titleLines: ['Turn every curiosity', 'into a course'],
  description:
    'Start with everyday Hong Kong life, then question, decide and build alongside an AI teacher, assistant and classmates. Every lesson develops something you can use.',
  library: 'Choose a learning route',
  libraryHint: 'Pick a direction, then enter a lesson where you can think, participate and make.',
  emptyTitle: 'Courses are being prepared',
  emptyHint: 'Published Hong Kong courses will appear here.',
  loading: 'Loading courses…',
  retry: 'Try again',
  openCourse: 'Start learning',
  lessonUnit: 'classroom scenes',
  aiTeacher: 'AI teacher',
  aiAssistant: 'AI assistant',
  aiClassmates: 'AI classmates',
  exploreCourses: 'Explore learning routes',
  allCourses: 'All courses',
  courseSection: 'Courses open now',
  courseSectionHint: 'Each lesson is a complete theme and part of a growing series.',
  coursesAvailable: 'courses available',
  comingSoon: 'Coming soon',
  lessonLabel: 'Lesson {number}',
  noCoursesForRoute: 'The first courses on this route are being prepared. Try another direction.',
  openSourceNotices: 'Open-source notices',
  topicLabels: {
    'ai-tech': 'AI & technology',
    chinese: 'Chinese expression',
    'hong-kong': 'Hong Kong discovery',
    leadership: 'Leadership & enterprise',
    'life-money': 'Money & life',
    interests: 'Interests & creativity',
  },
  topicDescriptions: {
    'ai-tech': 'Understand, use and create',
    chinese: 'Read, write and communicate',
    'hong-kong': 'City, nature and culture',
    leadership: 'Collaborate, decide and act',
    'life-money': 'Choice, risk and responsibility',
    interests: 'Science, art and imagination',
  },
  audienceLabels: {
    primary: 'Upper primary',
    secondary: 'Junior secondary',
    adult: 'Adults',
  },
  languageLabels: {
    'zh-hk': 'Hong Kong Cantonese',
    'zh-cn': 'Mandarin',
    en: 'English',
  },
};

export function learnerHomeCopy(locale: string): LearnerHomeCopy {
  return locale.toLowerCase().startsWith('zh') ? ZH_HK_COPY : EN_COPY;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is readonly T[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.length > 0 && value.every((item) => allowed.includes(item)))
  );
}

function isOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T | undefined {
  return value === undefined || (typeof value === 'string' && allowed.includes(value as T));
}

function isCourseSummary(value: unknown): value is LearnerCourseSummary {
  if (!value || typeof value !== 'object') return false;
  const course = value as Record<string, unknown>;
  return (
    typeof course.id === 'string' &&
    course.id.length > 0 &&
    typeof course.name === 'string' &&
    course.name.length > 0 &&
    isFiniteNumber(course.sceneCount) &&
    isFiniteNumber(course.createdAt) &&
    isFiniteNumber(course.updatedAt) &&
    isFiniteNumber(course.publishedAt) &&
    (course.description === undefined || typeof course.description === 'string') &&
    (course.gradeRange === undefined ||
      (typeof course.gradeRange === 'string' && course.gradeRange.trim().length > 0)) &&
    isOptionalEnumArray(course.topics, LEARNER_COURSE_TOPICS) &&
    isOptionalEnumArray(course.audiences, LEARNER_COURSE_AUDIENCES) &&
    isOptionalEnum(course.language, LEARNER_COURSE_LANGUAGES) &&
    (course.series === undefined ||
      (typeof course.series === 'string' && course.series.trim().length > 0)) &&
    (course.lessonNumber === undefined ||
      (isFiniteNumber(course.lessonNumber) &&
        Number.isInteger(course.lessonNumber) &&
        course.lessonNumber > 0))
  );
}

export function parseLearnerCourseResponse(value: unknown): LearnerCourseSummary[] {
  if (!value || typeof value !== 'object') return [];
  const courses = (value as { courses?: unknown }).courses;
  return Array.isArray(courses) ? courses.filter(isCourseSummary) : [];
}

export function filterLearnerCourses(
  courses: readonly LearnerCourseSummary[],
  topic: LearnerCourseFilter,
): LearnerCourseSummary[] {
  return topic === 'all'
    ? [...courses]
    : courses.filter((course) => course.topics?.includes(topic));
}
