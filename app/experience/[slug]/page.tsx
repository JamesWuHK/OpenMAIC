import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, Clock3, Languages, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';

import { FirstLessonExperience } from '@/components/learner/first-lesson-experience';
import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import { getFirstLessonTitle } from '@/lib/learner/series-experience';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';

interface ExperiencePageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const content = await readLearnerSiteContent();
  const { slug } = await params;
  const series = content.series.find((item) => item.slug === slug);
  return series
    ? { title: `${getFirstLessonTitle(series)}｜免費體驗｜万里 AI 課堂` }
    : { title: '找不到體驗課｜万里 AI 課堂' };
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const content = await readLearnerSiteContent();
  const { slug } = await params;
  const series = content.series.find((item) => item.slug === slug);
  if (!series) notFound();
  const firstLesson = series.lessons?.[0];

  return (
    <LearnerPageShell>
      <Link
        href={`/series/${series.slug}`}
        className="mb-5 inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#315374] dark:text-[#b1c5d9]"
      >
        <ArrowLeft className="size-4" />
        返回系列詳情
      </Link>

      <header className="relative isolate overflow-hidden rounded-[2.5rem] bg-[#071a35] px-6 py-10 text-white sm:px-10 lg:px-14">
        {series.heroImage ? (
          <>
            <SeriesCoverImage
              src={series.heroImage}
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="-z-20 object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06182f] via-[#06182f]/90 to-[#06182f]/32" />
          </>
        ) : null}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[.16em] text-[#8ef2f6]">
            <Sparkles className="size-3.5" />
            免費開放體驗 · 第 1 課
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-.055em] sm:text-6xl">
            {getFirstLessonTitle(series)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-[#d9e8f5]">
            {firstLesson?.summary ?? series.summary}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><Clock3 className="size-3.5" />約 5–8 分鐘</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><Languages className="size-3.5" />授課語言：{series.languages.join(' · ')}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><BookOpenCheck className="size-3.5" />{series.audience}</span>
          </div>
        </div>
      </header>

      <div className="py-12">
        <FirstLessonExperience question={firstLesson?.question ?? series.question} artifact={firstLesson?.outcome ?? series.finalArtifact} />
      </div>
    </LearnerPageShell>
  );
}
