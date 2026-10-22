import { describe, expect, it } from 'vitest';

import {
  filterLearnerCourses,
  learnerHomeCopy,
  parseLearnerCourseResponse,
} from '@/lib/learner/home-model';

describe('learner home model', () => {
  it('uses Traditional Chinese for Hong Kong and other Chinese locales', () => {
    expect(learnerHomeCopy('zh-TW')).toMatchObject({
      eyebrow: '香港出發 · AI 共學課堂',
      title: '把每個好奇心，變成一門課',
      library: '選一條學習路線',
      openSourceNotices: '開源軟件聲明',
      topicLabels: {
        'ai-tech': 'AI 科技',
        chinese: '中文表達',
        'hong-kong': '香港探索',
        leadership: '領導力與創業',
        'life-money': '財商與生活',
        interests: '興趣與創造',
      },
    });
    expect(learnerHomeCopy('zh-CN').library).toBe('選一條學習路線');
  });

  it('uses English for English and unsupported locales', () => {
    expect(learnerHomeCopy('en-US')).toMatchObject({
      eyebrow: 'FROM HONG KONG · AI LEARNING STUDIO',
      title: 'Turn every curiosity into a course',
      library: 'Choose a learning route',
      openSourceNotices: 'Open-source notices',
    });
    expect(learnerHomeCopy('ja-JP').library).toBe('Choose a learning route');
  });

  it('accepts only well-formed published course summaries', () => {
    expect(
      parseLearnerCourseResponse({
        courses: [
          {
            id: 'course-1',
            name: 'Hong Kong Stories',
            description: 'Learn together',
            sceneCount: 8,
            createdAt: 1,
            updatedAt: 2,
            publishedAt: 3,
            topics: ['ai-tech', 'interests'],
            audiences: ['primary', 'secondary'],
            gradeRange: '小四至中一',
            language: 'zh-hk',
            series: 'Hong Kong AI Literacy',
            lessonNumber: 2,
          },
          { id: '', name: 'bad', sceneCount: 1, createdAt: 1, updatedAt: 1, publishedAt: 1 },
        ],
      }),
    ).toEqual([
      {
        id: 'course-1',
        name: 'Hong Kong Stories',
        description: 'Learn together',
        sceneCount: 8,
        createdAt: 1,
        updatedAt: 2,
        publishedAt: 3,
        topics: ['ai-tech', 'interests'],
        audiences: ['primary', 'secondary'],
        gradeRange: '小四至中一',
        language: 'zh-hk',
        series: 'Hong Kong AI Literacy',
        lessonNumber: 2,
      },
    ]);
    expect(parseLearnerCourseResponse({ courses: 'not-an-array' })).toEqual([]);
  });

  it('rejects malformed discovery metadata instead of exposing an unstable filter', () => {
    expect(
      parseLearnerCourseResponse({
        courses: [
          {
            id: 'bad-topic',
            name: 'Bad topic',
            sceneCount: 1,
            createdAt: 1,
            updatedAt: 1,
            publishedAt: 1,
            topics: ['not-a-topic'],
          },
        ],
      }),
    ).toEqual([]);
  });

  it('filters courses by learning route while keeping the all-courses view intact', () => {
    const courses = parseLearnerCourseResponse({
      courses: [
        {
          id: 'ai-course',
          name: 'AI course',
          sceneCount: 1,
          createdAt: 1,
          updatedAt: 1,
          publishedAt: 1,
          topics: ['ai-tech'],
        },
        {
          id: 'language-course',
          name: 'Language course',
          sceneCount: 1,
          createdAt: 1,
          updatedAt: 1,
          publishedAt: 1,
          topics: ['chinese'],
        },
      ],
    });

    expect(filterLearnerCourses(courses, 'all')).toEqual(courses);
    expect(filterLearnerCourses(courses, 'ai-tech').map((course) => course.id)).toEqual([
      'ai-course',
    ]);
    expect(filterLearnerCourses(courses, 'leadership')).toEqual([]);
  });
});
