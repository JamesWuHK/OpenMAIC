import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, Languages, LockKeyhole } from 'lucide-react';
import { notFound } from 'next/navigation';

import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import {
  getSeriesLessonHref,
  isSeriesLessonOpen,
} from '@/lib/learner/series-experience';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';

interface LessonPageProps {
  readonly params: Promise<{ readonly slug: string; readonly number: string }>;
}

export const dynamic = 'force-dynamic';

async function findLesson(params: LessonPageProps['params']) {
  const content = await readLearnerSiteContent();
  const { slug, number } = await params;
  const series = content.series.find((item) => item.slug === slug);
  const lessonNumber = Number(number);
  const lesson = series?.lessons?.find((item) => item.number === lessonNumber);
  return { series, lesson, lessonNumber };
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { series, lesson } = await findLesson(params);
  return series && lesson
    ? {
        title: `第 ${lesson.number} 課：${lesson.title}｜${series.title}｜万里 AI 課堂`,
        description: lesson.summary,
      }
    : { title: '找不到課程｜万里 AI 課堂' };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { series, lesson, lessonNumber } = await findLesson(params);
  if (!series || !lesson || !Number.isInteger(lessonNumber)) notFound();

  const isOpen = isSeriesLessonOpen(series, lesson.number);
  const previousLesson = series.lessons?.find((item) => item.number === lesson.number - 1);
  const nextLesson = series.lessons?.find((item) => item.number === lesson.number + 1);

  return (
    <LearnerPageShell>
      <Link
        href={`/series/${series.slug}#lesson-${lesson.number}`}
        className="mb-6 inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#315374] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:text-[#b1c5d9]"
      >
        <ArrowLeft className="size-4" />
        返回《{series.title}》目錄
      </Link>

      <article className="overflow-hidden rounded-[2.25rem] border border-[#174b80]/12 bg-white shadow-[0_28px_80px_rgba(15,58,102,.12)] dark:border-white/10 dark:bg-[#0b1c31]">
        <div className="relative isolate min-h-72 overflow-hidden bg-[#071a35] px-7 py-9 text-white sm:px-10 sm:py-12">
          {series.heroImage ? (
            <>
              <SeriesCoverImage
                src={series.heroImage}
                priority
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="-z-20 object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06182f] via-[#06182f]/92 to-[#06182f]/38" />
            </>
          ) : null}
          <div className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#71dce5]">
            {series.signal} / LESSON {String(lesson.number).padStart(2, '0')}
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            {lesson.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-[#d7e7f6]">{lesson.question}</p>
        </div>

        <div className="grid gap-10 px-7 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
              Lesson brief
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">這一課會做甚麼？</h2>
            <p className="mt-5 text-base leading-8 text-[#45617e] dark:text-[#b1c5d9]">{lesson.summary}</p>
            <div className="mt-7 rounded-[1.4rem] bg-[#e8f2fb] p-5 dark:bg-white/7">
              <div className="flex items-center gap-2 text-sm font-black text-[#173f67] dark:text-[#d9e8f5]">
                <BookOpenCheck className="size-4 text-[#1847d6] dark:text-[#71dce5]" />
                完成本課後的作品
              </div>
              <p className="mt-2 text-sm text-[#45617e] dark:text-[#b1c5d9]">{lesson.outcome}</p>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-[#174b80]/10 bg-[#f7fbff] p-6 dark:border-white/10 dark:bg-[#10243c]">
            <div className="flex items-center gap-2 text-xs font-black text-[#315374] dark:text-[#b1c5d9]">
              <Clock3 className="size-4" />
              {series.minutesPerLesson}
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs font-black text-[#315374] dark:text-[#b1c5d9]">
              <Languages className="mt-0.5 size-4 shrink-0" />
              授課語言：{series.languages.join(' · ')}
            </div>
            {isOpen ? (
              <Link
                href={getSeriesLessonHref(series, lesson.number)}
                className="mt-6 flex items-center justify-between rounded-2xl bg-[#35d7e1] px-5 py-4 text-sm font-black text-[#071a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6]"
              >
                進入本課 <ArrowRight className="size-4" />
              </Link>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#174b80]/20 px-5 py-4 dark:border-white/15">
                <div className="flex items-center gap-2 text-sm font-black"><LockKeyhole className="size-4" />課堂籌備中</div>
                <p className="mt-2 text-xs leading-5 text-[#607994] dark:text-[#91a9c0]">
                  課程目錄已公開；互動課堂完成後，這裡會直接顯示進入按鈕。
                </p>
              </div>
            )}
          </aside>
        </div>
      </article>

      <nav className="mt-7 grid gap-3 sm:grid-cols-2" aria-label="本系列課程導航">
        {previousLesson ? (
          <Link href={`/series/${series.slug}/lessons/${previousLesson.number}`} className="rounded-2xl border border-[#174b80]/10 bg-white/75 p-5 text-sm font-bold dark:border-white/10 dark:bg-white/5">
            <span className="block text-xs text-[#607994] dark:text-[#91a9c0]">上一課</span>
            <span className="mt-1 block">← {previousLesson.title}</span>
          </Link>
        ) : <span />}
        {nextLesson ? (
          <Link href={`/series/${series.slug}/lessons/${nextLesson.number}`} className="rounded-2xl border border-[#174b80]/10 bg-white/75 p-5 text-right text-sm font-bold dark:border-white/10 dark:bg-white/5">
            <span className="block text-xs text-[#607994] dark:text-[#91a9c0]">下一課</span>
            <span className="mt-1 block">{nextLesson.title} →</span>
          </Link>
        ) : null}
      </nav>
    </LearnerPageShell>
  );
}
