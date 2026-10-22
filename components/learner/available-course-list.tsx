'use client';

import Link from 'next/link';
import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { learnerHomeCopy, parseLearnerCourseResponse } from '@/lib/learner/home-model';
import type { LearnerCourseSummary } from '@/lib/learner/public-courses';

export function AvailableCourseList() {
  const copy = learnerHomeCopy('zh-HK');
  const [courses, setCourses] = useState<LearnerCourseSummary[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/learner/courses', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Course catalog returned ${response.status}`);
        return parseLearnerCourseResponse(await response.json());
      })
      .then((next) => {
        if (cancelled) return;
        setCourses(next);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[1.6rem] border border-[#174b80]/10 bg-white/65 text-sm font-bold text-[#607994] dark:border-white/10 dark:bg-white/5 dark:text-[#91a9c0]">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[1.6rem] border border-[#174b80]/10 bg-white/65 px-5 text-center text-sm text-[#607994] dark:border-white/10 dark:bg-white/5 dark:text-[#91a9c0]">
        <CircleAlert className="mr-2 size-4" />
        暫時未能載入課堂，請稍後再試。
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[1.6rem] border border-dashed border-[#174b80]/20 bg-white/45 px-5 text-center text-sm text-[#607994] dark:border-white/15 dark:bg-white/[0.03] dark:text-[#91a9c0]">
        首批課堂正在準備。你可以先查看系列內容與學習成果。
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/classroom/${encodeURIComponent(course.id)}`}
          className="group rounded-[1.5rem] border border-[#174b80]/10 bg-white/82 p-6 shadow-[0_14px_36px_rgba(22,64,108,0.07)] transition hover:-translate-y-1 hover:border-[#174b80]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:border-white/10 dark:bg-[#0d1d31]/82"
        >
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1847d6] dark:text-[#71dce5]">
            {course.series ?? '互動課堂'}
            {course.lessonNumber ? ` · 第 ${course.lessonNumber} 課` : ''}
          </div>
          <h3 className="mt-3 text-xl font-black tracking-[-0.035em]">{course.name}</h3>
          {course.description ? (
            <p className="mt-3 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
              {course.description}
            </p>
          ) : null}
          <div className="mt-5 flex items-center justify-between border-t border-[#174b80]/10 pt-4 text-sm font-bold dark:border-white/10">
            <span>開始學習</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}
