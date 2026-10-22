import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Languages,
  Play,
  Target,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { SeriesArtwork } from '@/components/learner/series-artwork';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import {
  getSeriesExperienceHref,
  getSeriesLessonHref,
  isSeriesLessonOpen,
} from '@/lib/learner/series-experience';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';

interface SeriesPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const content = await readLearnerSiteContent();
  const { slug } = await params;
  const series = content.series.find((item) => item.slug === slug);
  return series
    ? {
        title: `${series.title}｜万里 AI 課堂`,
        description: series.summary,
        openGraph: series.heroImage
          ? {
              title: `${series.title}｜万里 AI 課堂`,
              description: series.promoHeadline ?? series.summary,
              images: [`https://class.wanli.ai${series.heroImage}`],
            }
          : undefined,
        twitter: series.heroImage
          ? {
              card: 'summary_large_image',
              title: `${series.title}｜万里 AI 課堂`,
              description: series.promoHeadline ?? series.summary,
              images: [`https://class.wanli.ai${series.heroImage}`],
            }
          : undefined,
      }
    : { title: '找不到系列｜万里 AI 課堂' };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const content = await readLearnerSiteContent();
  const { slug } = await params;
  const series = content.series.find((item) => item.slug === slug);
  if (!series) notFound();
  const sources = series.sourceIds
    .map((sourceId) => content.sources.find((source) => source.id === sourceId))
    .filter((source) => source !== undefined);
  const experienceHref = getSeriesExperienceHref(series);
  const isNobelLecture =
    series.slug === 'nobel-curiosity-lab' &&
    series.liveCourseIds?.includes('hk-nobel-01-kagan-lecture');
  const publishedLessons = isNobelLecture
    ? (await listFilesystemPublishedCourses())
        .filter((course) => series.liveCourseIds?.includes(course.id))
        .sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0))
    : [];

  return (
    <LearnerPageShell>
      <div className="mb-5">
        <Link
          href="/courses#series"
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#315374] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:text-[#b1c5d9]"
        >
          <ArrowLeft className="size-4" />
          返回所有系列
        </Link>
      </div>

      <section className="relative isolate min-h-[650px] overflow-hidden rounded-[2.5rem] border border-[#1c64b7]/22 bg-[#071a35] px-6 py-10 text-white shadow-[0_34px_100px_rgba(5,36,78,0.26)] sm:px-10 sm:py-14 lg:px-16">
        <SeriesArtwork series={series} className="!absolute inset-0 -z-20" />
        {series.heroImage ? (
          <>
            <SeriesCoverImage
              src={series.heroImage}
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="-z-20 object-cover object-center"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06182f] via-[#06182f]/92 to-[#06182f]/28" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06182f]/76 via-transparent to-[#06182f]/12" />
          </>
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(53,215,225,0.2),transparent_62%)]"
        />
        <div className="relative grid min-h-[540px] gap-12 lg:grid-cols-[1fr_330px] lg:items-end">
          <div>
            <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#8ef2f6]">
              {series.signal} ·{' '}
              {series.status === 'open'
                ? '可以開始'
                : series.status === 'preview'
                  ? '即將開課'
                  : '策劃中'}
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-8xl">
              {series.title}
            </h1>
            {series.promoHeadline ? (
              <p className="mt-6 max-w-2xl text-2xl font-black leading-9 text-[#ffb09b] sm:text-3xl">
                {series.promoHeadline}
              </p>
            ) : null}
            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white">
              {series.question}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#c5d9ed]">{series.summary}</p>
            <Link
              href={experienceHref}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071a35]"
            >
              <Play className="size-3.5 fill-current" />
              免費體驗第 1 課
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <aside className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/12 shadow-[0_24px_60px_rgba(0,0,0,.24)] backdrop-blur-xl">
            {[
              [Clock3, `${series.lessonCount} 課`, series.minutesPerLesson],
              [Target, '適合年級', series.audience],
              [BookOpenCheck, isNobelLecture ? '學習收穫' : '最後作品', series.finalArtifact],
              [Languages, '授課語言', series.languages.join(' · ')],
            ].map(([Icon, label, value]) => (
              <div key={label as string} className="min-h-36 bg-[#0b2340]/90 p-5">
                <Icon className="size-4 text-[#71dce5]" />
                <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  {label as string}
                </div>
                <div className="mt-1 text-sm font-bold leading-5">{value as string}</div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {series.introduction ? (
        <section
          className="grid gap-6 pt-14 lg:grid-cols-[1.05fr_0.95fr]"
          aria-labelledby="series-intro-title"
        >
          <div className="rounded-[1.75rem] border border-[#174b80]/10 bg-white/78 p-7 sm:p-9 dark:border-white/10 dark:bg-white/5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#e65f43] dark:text-[#ff9c83]">
              Course introduction
            </div>
            <h2
              id="series-intro-title"
              className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl"
            >
              從一個真問題開始
            </h2>
            <p className="mt-6 text-base leading-8 text-[#45617e] dark:text-[#b1c5d9]">
              {series.introduction}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#ff7a59]/18 bg-[#fff6f2] p-7 sm:p-9 dark:border-[#ff9c83]/16 dark:bg-[#2a1920]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#e65f43] dark:text-[#ff9c83]">
              Why this course
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">課程設計重點</h2>
            <div className="mt-6 space-y-4">
              {series.highlights?.map((highlight) => (
                <div
                  key={highlight}
                  className="flex gap-3 text-sm font-bold leading-6 text-[#315374] dark:text-[#d8c5c0]"
                >
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#e65f43] dark:text-[#ff9c83]" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 pt-14 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-[#174b80]/10 bg-white/75 p-7 dark:border-white/10 dark:bg-white/5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
            Learning outcomes
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">完成後，你會帶走什麼？</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {series.capabilities.map((capability) => (
              <div
                key={capability}
                className="rounded-2xl bg-[#e7f0f8] px-4 py-4 text-sm font-bold dark:bg-white/7"
              >
                <span className="mr-2 text-[#1847d6] dark:text-[#71dce5]">●</span>
                {capability}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-[#174b80]/10 bg-[#f7fbff] p-7 dark:border-white/10 dark:bg-[#0d1d31]">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
            {isNobelLecture ? 'Understand the discovery' : 'Make something'}
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
            {isNobelLecture ? '聽懂發現，看見科學的意義' : '不是看完，是做出來'}
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
            {isNobelLecture ? (
              <>每課以生活例子、清晰講解和原創圖解，介紹一位得主的研究與人類意義。孩子可按自己的步調聆聽、重看，並用簡短理解題整理重點；無需製作或提交作品。</>
            ) : (
              <>系列以「{series.finalArtifact}」收束。AI 老師負責講清楚，AI 助教提供分級提示，AI 同學帶來不同觀點；最後的判斷與作品由學生完成。</>
            )}
          </p>
        </div>
      </section>

      {isNobelLecture && publishedLessons.length > 0 ? (
        <section className="pt-16" aria-labelledby="published-lessons-title">
          <h2 id="published-lessons-title" className="text-3xl font-black tracking-[-0.05em]">
            已開放的課程
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
            按課次聆聽，或選擇你最想了解的發現。其餘課次製作完成並通過獨立內容審核後開放。
          </p>
          <ol className="mt-6 grid gap-5 md:grid-cols-2">
            {publishedLessons.map((course) => (
              <li key={course.id} className="rounded-2xl border border-[#174b80]/15 bg-white p-6 dark:border-white/15 dark:bg-[#0d1d31]">
                <p className="text-sm font-bold text-[#1847d6] dark:text-[#71dce5]">
                  第 {course.lessonNumber} 課
                </p>
                <h3 className="mt-2 text-xl font-black">{course.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
                  {course.description}
                </p>
                <Link href={`/classroom/${course.id}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1847d6] px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d7e1]">
                  進入第 {course.lessonNumber} 課 <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {series.lessons?.length ? (
        <section className="pt-16" aria-labelledby="lesson-outline-title">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
                Learning route
              </div>
              <h2
                id="lesson-outline-title"
                className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl"
              >
                {series.lessonCount} 節課，一步步完成主題作品
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
              每課完成一件作品；前一課的能力，會成為下一課的工具。
            </p>
          </div>
          <ol className="relative grid gap-4 before:absolute before:bottom-8 before:left-[23px] before:top-8 before:hidden before:w-px before:bg-gradient-to-b before:from-[#35d7e1] before:via-[#1847d6]/25 before:to-transparent lg:grid-cols-2 lg:before:block">
            {series.lessons.map((lesson) => {
              const lessonHref = getSeriesLessonHref(series, lesson.number);
              const isOpen = isSeriesLessonOpen(series, lesson.number);
              return (
              <li
                key={lesson.number}
                id={`lesson-${lesson.number}`}
                className="group relative overflow-hidden rounded-[1.6rem] border border-[#174b80]/10 bg-white p-6 shadow-[0_14px_38px_rgba(22,64,108,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(22,64,108,.11)] dark:border-white/10 dark:bg-[#0d1d31]"
              >
                <div className="flex items-start gap-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#071a35] font-mono text-sm font-black text-[#71dce5] dark:bg-[#f4f8ff] dark:text-[#071a35]">
                    {String(lesson.number).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-[-0.035em]">{lesson.title}</h3>
                    <p className="mt-2 text-sm font-bold text-[#e65f43] dark:text-[#ff9c83]">
                      {lesson.question}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
                      {lesson.summary}
                    </p>
                    <div className="mt-4 inline-flex rounded-full bg-[#e8f0f8] px-3 py-1.5 text-xs font-bold text-[#315374] dark:bg-white/8 dark:text-[#b3c7da]">
                      本課作品：{lesson.outcome}
                    </div>
                    <Link
                      href={lessonHref}
                      className={`ml-2 mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] ${
                        isOpen
                          ? 'bg-[#35d7e1] text-[#071a35]'
                          : 'border border-[#174b80]/15 bg-white text-[#315374] dark:border-white/12 dark:bg-white/6 dark:text-[#b1c5d9]'
                      }`}
                    >
                      {isOpen ? '進入課堂' : '查看本課'}
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="pt-16" aria-labelledby="source-title">
        <div className="mb-7">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
            Research basis
          </div>
          <h2 id="source-title" className="mt-2 text-3xl font-black tracking-[-0.05em]">
            這個系列依據什麼？
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
            下列資料只作事實核對與課程設計依據。課程文字、例子、角色、圖像與互動均重新創作，不代表相關機構參與製作或認可本課程。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.4rem] border border-[#174b80]/10 bg-white/72 p-5 transition hover:-translate-y-0.5 hover:border-[#174b80]/22 dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-xs font-bold text-[#1847d6] dark:text-[#71dce5]">
                {source.organisation}
              </div>
              <h3 className="mt-2 font-black">{source.title}</h3>
              <p className="mt-3 text-xs leading-5 text-[#607994] dark:text-[#91a9c0]">
                {source.use}
              </p>
            </a>
          ))}
        </div>
      </section>
    </LearnerPageShell>
  );
}
