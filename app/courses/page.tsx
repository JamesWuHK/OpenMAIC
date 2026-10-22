import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play, RadioTower, SlidersHorizontal } from 'lucide-react';

import { AvailableCourseList } from '@/components/learner/available-course-list';
import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import { SeriesCard } from '@/components/learner/series-card';
import type { LearnerAgeBand } from '@/lib/learner/site-content';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';
import type { LearnerCourseTopic } from '@/lib/learner/public-courses';

export const metadata: Metadata = {
  title: '發現課程｜万里 AI 課堂',
  description: '按年齡與主題探索香港本地化的 AI 互動課程系列。',
};

export const dynamic = 'force-dynamic';

interface CoursesPageProps {
  readonly searchParams: Promise<{ readonly age?: string; readonly topic?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const content = await readLearnerSiteContent();
  const params = await searchParams;
  const age = content.ageBands.some((item) => item.id === params.age)
    ? (params.age as LearnerAgeBand)
    : undefined;
  const topic = content.topics.some((item) => item.id === params.topic)
    ? (params.topic as LearnerCourseTopic)
    : undefined;
  const visibleSeries = content.series.filter(
    (series) =>
      (!age || series.ageBands.includes(age)) && (!topic || series.topics.includes(topic)),
  );
  const activeAge = content.ageBands.find((item) => item.id === age);
  const activeTopic = content.topics.find((item) => item.id === topic);

  return (
    <LearnerPageShell>
      <section className="relative isolate min-h-[500px] overflow-hidden rounded-[2.5rem] border border-[#35d7e1]/25 bg-[#071a35] text-white shadow-[0_34px_100px_rgba(5,36,78,0.24)]">
        <SeriesCoverImage
          src={content.hero.image}
          priority
          sizes="(min-width: 1280px) 1400px, 100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06182f] via-[#06182f]/94 via-50% to-[#06182f]/15" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#06182f]/85 to-transparent" />
        <div className="flex min-h-[500px] max-w-3xl flex-col justify-between p-7 sm:p-12 lg:p-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#71dce5]/35 bg-[#082b4d]/72 px-4 py-2 font-mono text-[10px] font-black tracking-[0.18em] text-[#8ef2f6] backdrop-blur-md">
              <RadioTower className="size-3.5" /> COURSE SIGNALS
            </div>
            <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[0.9] tracking-[-0.07em] sm:text-7xl">
              由一個真問題，走進一個系列
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#d3e5f6] sm:text-lg">
              按年齡或興趣選擇方向。每一課都能獨立完成，也會在系列中逐步建立判斷、表達與創造能力。
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#available"
              className="inline-flex items-center gap-2 rounded-full bg-[#35d7e1] px-5 py-3 text-sm font-black text-[#071a35]"
            >
              <Play className="size-3.5 fill-current" />
              現在開始一課
            </a>
            <a
              href="#series"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-5 py-3 text-sm font-black text-white backdrop-blur-md"
            >
              查看所有系列
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="age" className="scroll-mt-6 pt-16" aria-labelledby="age-title">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
              Find your level
            </div>
            <h2 id="age-title" className="mt-2 text-3xl font-black tracking-[-0.05em]">
              按年齡探索
            </h2>
          </div>
          {age || topic ? (
            <Link
              href="/courses#series"
              className="text-sm font-bold text-[#1847d6] dark:text-[#71dce5]"
            >
              清除篩選
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {content.ageBands.map((band) => (
            <Link
              key={band.id}
              href={`/courses?age=${band.id}${topic ? `&topic=${topic}` : ''}#series`}
              aria-current={age === band.id ? 'true' : undefined}
              className={`rounded-[1.35rem] border p-4 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] ${
                age === band.id
                  ? 'border-[#071a35] bg-[#071a35] text-white dark:border-[#71dce5] dark:bg-[#102640]'
                  : 'border-[#174b80]/10 bg-white/72 dark:border-white/10 dark:bg-white/5'
              }`}
            >
              <div className="font-bold">{band.title}</div>
              <div
                className={`mt-2 text-xs leading-5 ${age === band.id ? 'text-white/70' : 'text-[#607994] dark:text-[#91a9c0]'}`}
              >
                {band.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-12" aria-labelledby="topic-title">
        <div className="mb-6 flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-[#1847d6] dark:text-[#71dce5]" />
          <h2 id="topic-title" className="text-xl font-black">
            再選一個主題
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {content.topics.map((item) => (
            <Link
              key={item.id}
              href={`/courses?topic=${item.id}${age ? `&age=${age}` : ''}#series`}
              aria-current={topic === item.id ? 'true' : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] ${
                topic === item.id
                  ? 'border-[#071a35] bg-[#071a35] text-white dark:border-white dark:bg-white dark:text-[#071a35]'
                  : 'border-[#174b80]/12 bg-white/75 text-[#315374] dark:border-white/12 dark:bg-white/5 dark:text-[#b1c5d9]'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>

      <section id="series" className="scroll-mt-6 pt-16" aria-labelledby="series-title">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
              Curated series
            </div>
            <h2
              id="series-title"
              className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl"
            >
              {activeAge || activeTopic
                ? `${activeAge?.title ?? ''}${activeAge && activeTopic ? ' · ' : ''}${activeTopic?.title ?? ''}`
                : '主題系列'}
            </h2>
          </div>
          <p className="text-sm text-[#607994] dark:text-[#91a9c0]">
            找到 {visibleSeries.length} 個系列
          </p>
        </div>
        {visibleSeries.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleSeries.map((series) => (
              <SeriesCard key={series.slug} series={series} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-[#174b80]/20 bg-white/45 px-6 py-16 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <h3 className="text-xl font-black">這個組合正在策劃</h3>
            <p className="mt-2 text-sm text-[#607994] dark:text-[#91a9c0]">
              先清除篩選，看看其他學習方向。
            </p>
          </div>
        )}
      </section>

      <section id="available" className="scroll-mt-6 pt-20" aria-labelledby="available-title">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
              Open classrooms
            </div>
            <h2 id="available-title" className="mt-2 text-3xl font-black tracking-[-0.05em]">
              現在可以學
            </h2>
          </div>
          <ArrowRight className="hidden size-5 sm:block" />
        </div>
        <AvailableCourseList />
      </section>
    </LearnerPageShell>
  );
}
