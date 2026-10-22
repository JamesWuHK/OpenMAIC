import Link from 'next/link';
import { ArrowRight, Clock3, GraduationCap, Languages, Play } from 'lucide-react';

import { SeriesArtwork, artworkThemeForSeries } from '@/components/learner/series-artwork';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import { getSeriesExperienceHref } from '@/lib/learner/series-experience';
import type { LearnerSeriesDefinition } from '@/lib/learner/site-content';

export function SeriesCard({ series }: { readonly series: LearnerSeriesDefinition }) {
  const artworkTheme = artworkThemeForSeries(series);
  const TopicIcon = artworkTheme.icon;
  const experienceHref = getSeriesExperienceHref(series);

  return (
    <article className="group relative flex min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-[#174b80]/10 bg-white shadow-[0_20px_55px_rgba(22,64,108,0.09)] transition duration-300 hover:-translate-y-1.5 hover:border-[#174b80]/20 hover:shadow-[0_32px_80px_rgba(22,64,108,0.17)] dark:border-white/10 dark:bg-[#0d1d31]">
      <Link
        href={`/series/${series.slug}`}
        aria-label={`查看${series.title}課程詳情`}
        className="absolute inset-0 z-20 rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d7e1] focus-visible:ring-inset"
      />
      <div className="relative h-64 overflow-hidden border-b border-[#174b80]/10 sm:h-72 dark:border-white/10">
        <SeriesArtwork series={series} />
        {series.heroImage ? (
          <>
            <SeriesCoverImage
              src={series.heroImage}
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover object-center transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071a35]/92 via-[#071a35]/10 to-transparent" />
          </>
        ) : null}
        <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-[#071a35]/72 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#8ef2f6] backdrop-blur-md">
            {series.signal}
          </span>
          <span
            className="flex size-10 items-center justify-center rounded-2xl border border-white/20 bg-[#071a35]/68 text-white backdrop-blur-md"
            aria-hidden="true"
          >
            <TopicIcon className="size-4" style={{ color: artworkTheme.accent }} />
          </span>
        </div>
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
          <p className="max-w-[78%] text-lg font-black leading-6 tracking-[-0.025em]">
            {series.question}
          </p>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#071a35]">
            {series.status === 'open'
              ? '可以開始'
              : series.status === 'preview'
                ? '即將開課'
                : '策劃中'}
          </span>
        </div>
      </div>
      <div className="relative flex flex-1 flex-col p-6">
        <h3 className="text-[1.75rem] font-black leading-[1.02] tracking-[-0.05em]">
          {series.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
          {series.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-[#315374] dark:text-[#b3c7da]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf4fa] px-3 py-1.5 dark:bg-white/8">
            <GraduationCap className="size-3.5" />
            {series.audience}
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-[#dff8fa] px-3 py-1.5 text-[#124f61] dark:bg-[#35d7e1]/12 dark:text-[#8ef2f6]">
            <Languages className="size-3.5" />
            <span>授課語言：</span>
            {series.languages.join(' · ')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf4fa] px-3 py-1.5 dark:bg-white/8">
            <Clock3 className="size-3.5" />
            {series.lessonCount} 課
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[#174b80]/10 pt-5 dark:border-white/10">
          <span className="text-xs font-black text-[#315374] dark:text-[#b3c7da]">
            查看完整課程
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-[#071a35] text-white transition-transform group-hover:translate-x-1 dark:bg-white dark:text-[#071a35]">
            <ArrowRight className="size-4" />
          </span>
        </div>
        <Link
          href={experienceHref}
          className="relative z-30 mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#35d7e1] px-4 py-3 text-xs font-black text-[#071a35] transition hover:bg-[#8ef2f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6]"
        >
          <Play className="size-3.5 fill-current" />
          免費體驗第 1 課
        </Link>
      </div>
    </article>
  );
}
