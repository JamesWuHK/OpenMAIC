// Only published, reviewed voice pairs participate in the combined learner control.
export const nobelVoicePairIds = [
  'hk-nobel-01-kagan-illustrated-v2',
  'hk-nobel-02-soai-illustrated-v2',
  'hk-nobel-03-halzen-illustrated-v2',
  'hk-nobel-04-deisseroth-illustrated-v2',
  'hk-nobel-05-hegemann-illustrated-v2',
  'hk-nobel-06-nagel-illustrated-v2',
  'hk-nobel-07-sakaguchi-illustrated-v2',
  'hk-nobel-08-hassabis-illustrated-v1',
] as const;

// Private preview IDs are stable; the published-course manifest controls catalog visibility.
const supplementalPreviewVoicePairIds = [
  'hk-supplement-ai-baoyu-preview',
  'hk-supplement-leaf-baoyu-preview',
  'hk-supplement-chinese-baoyu-preview',
  'hk-supplement-bus-baoyu-preview',
  'hk-supplement-radar-baoyu-preview',
  'hk-supplement-robot-baoyu-preview',
] as const;

const learnerVoicePairIds = new Set<string>([
  ...nobelVoicePairIds,
  ...supplementalPreviewVoicePairIds,
]);

export function getNobelVoicePair(classroomId: string | null | undefined) {
  if (!classroomId) return null;
  const base = classroomId.replace(/-mandarin$/, '');
  if (!learnerVoicePairIds.has(base)) return null;
  return { base, mandarin: classroomId.endsWith('-mandarin') };
}

export function getNobelClassroomId(pathname: string | null) {
  const match = pathname?.match(/^\/classroom\/([^/]+)\/?$/);
  return match && getNobelVoicePair(match[1]) ? match[1] : null;
}

export function getNobelVoiceTarget(classroomId: string, locale: string) {
  const pair = getNobelVoicePair(classroomId);
  if (!pair || !['zh-TW', 'zh-CN'].includes(locale)) return null;
  const target = pair.base + (locale === 'zh-CN' ? '-mandarin' : '');
  return target === classroomId ? null : target;
}

export function parseNobelSceneOrder(value: string | null) {
  if (value === null || !/^(0|[1-9]\d?)$/.test(value)) return null;
  return Number(value);
}

export function getNobelVoiceHref(targetId: string, sceneOrder?: number) {
  if (!getNobelVoicePair(targetId)) return null;
  const query = typeof sceneOrder === 'number' && Number.isInteger(sceneOrder) && sceneOrder >= 0 && sceneOrder < 100
    ? '?nobelScene=' + sceneOrder
    : '';
  return '/classroom/' + targetId + query;
}

export function getNobelVoiceDescription(classroomId: string, locale: string) {
  const pair = getNobelVoicePair(classroomId);
  if (!pair) return undefined;
  if (locale === 'zh-TW') return '粵語講解';
  if (locale === 'zh-CN') return '普通话讲解';
  if (locale === 'en-US') return 'UI only · ' + (pair.mandarin ? 'Mandarin' : 'Cantonese') + ' narration';
  return undefined;
}

/** One catalog entry per bilingual lesson, with the Cantonese route as its entry point. */
export function listNobelCatalogEntries<T extends { id: string }>(courses: readonly T[]): T[] {
  const availableIds = new Set(courses.map((course) => course.id));
  return courses.filter((course) => {
    const pair = getNobelVoicePair(course.id);
    return !pair?.mandarin || !availableIds.has(pair.base);
  });
}
