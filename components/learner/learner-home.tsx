'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Compass,
  Cpu,
  GraduationCap,
  ImageIcon,
  Landmark,
  Languages,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Slide } from '@openmaic/dsl';

import { SlideThumbnail } from '@/components/slide-renderer/SlideThumbnail';
import { LearnerSiteFooter, LearnerSiteHeader } from '@/components/learner/learner-site-chrome';
import { SeriesArtwork } from '@/components/learner/series-artwork';
import { SeriesCard } from '@/components/learner/series-card';
import { SeriesCoverImage } from '@/components/learner/series-cover-image';
import { useI18n } from '@/lib/hooks/use-i18n';
import {
  filterLearnerCourses,
  learnerHomeCopy,
  parseLearnerCourseResponse,
  type LearnerCourseFilter,
} from '@/lib/learner/home-model';
import type { LearnerCourseSummary, LearnerCourseTopic } from '@/lib/learner/public-courses';
import type { LearnerSiteContent } from '@/lib/learner/site-content';
import { cn } from '@/lib/utils';
import { getFirstSlideForStage, revokeThumbnailSlideMediaUrls } from '@/lib/utils/stage-storage';

interface LearningRouteDefinition {
  readonly id: LearnerCourseTopic;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly wash: string;
}

const LEARNING_ROUTES: readonly LearningRouteDefinition[] = [
  { id: 'ai-tech', icon: Cpu, accent: '#35d7e1', wash: '#d9f9fb' },
  { id: 'chinese', icon: MessageCircle, accent: '#ff7a59', wash: '#ffe7df' },
  { id: 'hong-kong', icon: Landmark, accent: '#f2b84b', wash: '#fff2cf' },
  { id: 'leadership', icon: Users, accent: '#8b6cf2', wash: '#ece7ff' },
  { id: 'life-money', icon: WalletCards, accent: '#42b883', wash: '#ddf7e9' },
  { id: 'interests', icon: Compass, accent: '#3d7df2', wash: '#dfeaff' },
] as const;

function routeForCourse(course: LearnerCourseSummary): LearningRouteDefinition {
  return LEARNING_ROUTES.find((route) => course.topics?.includes(route.id)) ?? LEARNING_ROUTES[0];
}

function revokeThumbnails(thumbnails: Record<string, Slide>) {
  for (const slide of Object.values(thumbnails)) revokeThumbnailSlideMediaUrls(slide);
}

export function LearnerHome() {
  const router = useRouter();
  const { locale } = useI18n();
  const copy = learnerHomeCopy(locale);
  const [courses, setCourses] = useState<LearnerCourseSummary[]>([]);
  const [siteContent, setSiteContent] = useState<LearnerSiteContent | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, Slide>>({});
  const [activeTopic, setActiveTopic] = useState<LearnerCourseFilter>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const thumbnailRef = useRef<Record<string, Slide>>({});

  const replaceThumbnails = useCallback((next: Record<string, Slide>) => {
    const previous = thumbnailRef.current;
    thumbnailRef.current = next;
    setThumbnails(next);
    window.setTimeout(() => revokeThumbnails(previous), 0);
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [courseResponse, contentResponse] = await Promise.all([
        fetch('/api/learner/courses', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/learner/site-content', { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!courseResponse.ok) {
        throw new Error(`Learner course catalog returned ${courseResponse.status}`);
      }
      if (!contentResponse.ok) {
        throw new Error(`Learner site content returned ${contentResponse.status}`);
      }
      const nextCourses = parseLearnerCourseResponse(await courseResponse.json());
      setSiteContent((await contentResponse.json()) as LearnerSiteContent);
      setCourses(nextCourses);
      const results = await Promise.allSettled(
        nextCourses.map((course) => getFirstSlideForStage(course.id)),
      );
      const nextThumbnails: Record<string, Slide> = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          nextThumbnails[nextCourses[index]!.id] = result.value;
        }
      });
      replaceThumbnails(nextThumbnails);
    } catch (error) {
      console.error('[LearnerHome] Failed to load courses', error);
      setFailed(true);
      setCourses([]);
      setSiteContent(null);
      replaceThumbnails({});
    } finally {
      setLoading(false);
    }
  }, [replaceThumbnails]);

  useEffect(() => {
    void loadCourses();
    return () => {
      revokeThumbnails(thumbnailRef.current);
      thumbnailRef.current = {};
    };
  }, [loadCourses]);

  const routeCounts = useMemo(
    () =>
      Object.fromEntries(
        LEARNING_ROUTES.map((route) => [
          route.id,
          courses.filter((course) => course.topics?.includes(route.id)).length,
        ]),
      ) as Record<LearnerCourseTopic, number>,
    [courses],
  );

  const visibleCourses = useMemo(
    () => filterLearnerCourses(courses, activeTopic),
    [activeTopic, courses],
  );

  const selectedRoute =
    activeTopic === 'all'
      ? null
      : (LEARNING_ROUTES.find((route) => route.id === activeTopic) ?? null);
  const launchSeries = siteContent?.series[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef4fb] text-[#071a35] dark:bg-[#07111f] dark:text-[#f4f8ff]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(14,71,129,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(14,71,129,0.055)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-20"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-24 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <LearnerSiteHeader />

        <section className="relative isolate min-h-[590px] overflow-hidden rounded-[2rem] border border-[#1c64b7]/25 bg-[#0a2442] text-white shadow-[0_34px_100px_rgba(5,36,78,0.24)] sm:rounded-[2.6rem]">
          <Image
            src={siteContent?.hero.image ?? '/learner/wanli-learning-hero.png'}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1480px"
            className="object-cover object-[68%_center] opacity-90 sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071a35]/95 via-[#071a35]/82 to-[#071a35]/55 sm:bg-gradient-to-r sm:from-[#071a35] sm:via-[#071a35]/96 sm:via-42% sm:to-[#071a35]/5" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#061427]/95 to-transparent" />
          <div
            aria-hidden="true"
            className="absolute -left-16 top-28 size-72 rounded-full border border-[#35d7e1]/25 shadow-[0_0_100px_rgba(53,215,225,0.12)]"
          />

          <div className="relative z-10 flex min-h-[590px] max-w-[760px] flex-col justify-between p-7 sm:p-11 lg:p-16">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#6ce7ee]/35 bg-[#092d50]/75 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ef2f6] backdrop-blur-md">
                <Sparkles className="size-3.5" />
                {siteContent?.hero.eyebrow ?? copy.eyebrow}
              </div>
              <h1
                aria-label={siteContent?.hero.title ?? copy.title}
                className="max-w-[690px] text-[2.35rem] font-black leading-[0.9] tracking-[-0.075em] sm:text-[clamp(3.2rem,7vw,6.7rem)]"
              >
                {(siteContent?.hero.title ? [siteContent.hero.title] : copy.titleLines).map(
                  (line) => (
                    <span key={line} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ),
                )}
              </h1>
              <p className="mt-7 max-w-[590px] text-pretty text-base leading-7 text-[#d7e7f7] sm:text-lg">
                {siteContent?.hero.description ?? copy.description}
              </p>
              <a
                href="#learning-routes"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#f4f8ff] px-5 py-3 text-sm font-black text-[#071a35] shadow-[0_12px_35px_rgba(3,18,38,0.28)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ef2f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a35] motion-reduce:transform-none motion-reduce:transition-none"
              >
                {copy.exploreCourses}
                <ArrowRight className="size-4" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-2.5">
              {[
                [GraduationCap, copy.aiTeacher],
                [Bot, copy.aiAssistant],
                [Users, copy.aiClassmates],
              ].map(([Icon, label]) => (
                <div
                  key={label as string}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#071a35]/58 px-4 py-2 text-sm font-semibold text-[#e7f2fc] backdrop-blur-md"
                >
                  <Icon className="size-4 text-[#6ce7ee]" />
                  {label as string}
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-11 right-10 hidden items-center gap-2 xl:flex"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">
              HK learning routes
            </span>
            <span className="h-px w-28 bg-gradient-to-r from-[#35d7e1] to-transparent" />
            <span className="size-2 rounded-full bg-[#35d7e1] shadow-[0_0_18px_#35d7e1]" />
          </div>
        </section>

        <section
          aria-label="万里 AI 課堂特色"
          className="relative z-20 mx-3 -mt-7 grid overflow-hidden rounded-[1.6rem] border border-white/55 bg-white/92 shadow-[0_22px_60px_rgba(5,36,78,0.16)] backdrop-blur-xl sm:mx-7 sm:grid-cols-2 lg:mx-12 lg:grid-cols-4 dark:border-white/10 dark:bg-[#0d1d31]/94"
        >
          {[
            [MapPin, '香港生活場景', '從熟悉的城市問題開始', '#f2b84b'],
            [ShieldCheck, '一手資料校準', '分清事實、模擬與想像', '#42b883'],
            [ImageIcon, '原創課程視覺', '文字與圖像重新製作', '#8b6cf2'],
            [MessagesSquare, 'AI 互動共學', '老師、助教、同學各有角色', '#35d7e1'],
          ].map(([Icon, title, description, accent], index) => (
            <div
              key={title as string}
              className="group relative flex min-h-28 items-center gap-4 border-b border-[#174b80]/10 p-5 sm:border-r lg:border-b-0 dark:border-white/10"
            >
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf4fb] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transform-none dark:bg-white/8"
                style={{ color: accent as string }}
              >
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <div className="text-sm font-black">{title as string}</div>
                <div className="mt-1 text-xs leading-5 text-[#607994] dark:text-[#91a9c0]">
                  {description as string}
                </div>
              </div>
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 font-mono text-[8px] font-black text-[#8ba0b5]/50"
              >
                0{index + 1}
              </span>
            </div>
          ))}
        </section>

        <section className="pt-16 sm:pt-20" aria-labelledby="featured-series-title">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
                Hong Kong first
              </div>
              <h2
                id="featured-series-title"
                className="mt-2 text-4xl font-black tracking-[-0.055em] sm:text-5xl"
              >
                從香港真問題出發
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-sm leading-6 text-[#45617e] dark:text-[#9fb5cb]">
                從中文表達、天氣、消息到 AI
                判斷，都是學生每天會遇到的事。先學會看證據，再學會使用工具。
              </p>
              <Link
                href="/courses#series"
                className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#1847d6] dark:text-[#71dce5]"
              >
                查看全部系列
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          {launchSeries ? (
            <Link
              href={`/series/${launchSeries.slug}`}
              className="group relative mb-6 grid min-h-[460px] overflow-hidden rounded-[2rem] border border-[#35d7e1]/25 bg-[#071a35] text-white shadow-[0_28px_80px_rgba(5,36,78,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] focus-visible:ring-offset-4 dark:focus-visible:ring-[#71dce5] dark:focus-visible:ring-offset-[#07111f] lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="relative min-h-72 overflow-hidden lg:order-2 lg:min-h-full">
                <SeriesArtwork series={launchSeries} />
                {launchSeries.heroImage ? (
                  <SeriesCoverImage
                    src={launchSeries.heroImage}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071a35] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#071a35]/50 lg:via-transparent" />
              </div>
              <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:order-1 lg:p-14">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#8ef2f6]">
                  <span>{launchSeries.signal}</span>
                  <span className="h-px w-10 bg-[#35d7e1]/60" />
                  <span>新系列預告</span>
                </div>
                <h3 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-6xl">
                  {launchSeries.title}
                </h3>
                <p className="mt-5 max-w-xl text-xl font-black leading-8 text-[#ffb09b] sm:text-2xl">
                  {launchSeries.promoHeadline}
                </p>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[#c5d9ed] sm:text-base">
                  {launchSeries.summary}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071a35]">
                    查看六課大綱
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
                  </span>
                  <span className="text-xs font-bold leading-5 text-white/65">
                    授課語言：{launchSeries.languages.join(' · ')}
                    <br />
                    適合年級：{launchSeries.audience} · {launchSeries.lessonCount} 課 ·{' '}
                    {launchSeries.minutesPerLesson}
                  </span>
                </div>
              </div>
            </Link>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {siteContent?.series.slice(1, 4).map((series) => (
              <SeriesCard key={series.slug} series={series} />
            ))}
          </div>
        </section>

        <section
          id="learning-routes"
          className="scroll-mt-6 pt-20 sm:pt-24"
          aria-labelledby="learner-routes-title"
        >
          <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
                <Route className="size-4" />
                Wanli learning routes
              </div>
              <h2
                id="learner-routes-title"
                className="text-4xl font-black tracking-[-0.055em] sm:text-5xl"
              >
                {copy.library}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#45617e] dark:text-[#9fb5cb]">
              {copy.libraryHint}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              aria-pressed={activeTopic === 'all'}
              onClick={() => setActiveTopic('all')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] focus-visible:ring-offset-2 motion-reduce:transition-none dark:focus-visible:ring-offset-[#07111f]',
                activeTopic === 'all'
                  ? 'border-[#071a35] bg-[#071a35] text-white dark:border-[#f4f8ff] dark:bg-[#f4f8ff] dark:text-[#071a35]'
                  : 'border-[#071a35]/12 bg-white/70 text-[#315374] hover:border-[#1847d6]/35 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:text-[#b1c5d9] dark:hover:bg-white/10',
              )}
            >
              {copy.allCourses} · {courses.length}
            </button>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#6d86a0] sm:block dark:text-[#7891aa]">
              Select a signal
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {LEARNING_ROUTES.map((route) => {
              const Icon = route.icon;
              const count = routeCounts[route.id];
              const active = activeTopic === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTopic(route.id)}
                  className={cn(
                    'group relative overflow-hidden rounded-[1.55rem] border p-5 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:focus-visible:ring-offset-[#07111f]',
                    active
                      ? '-translate-y-1 border-[#153b68] bg-[#071a35] text-white shadow-[0_18px_45px_rgba(7,26,53,0.22)] dark:border-[#67e0e8]/35 dark:bg-[#102640]'
                      : 'border-[#174b80]/10 bg-white/75 text-[#071a35] shadow-[0_12px_35px_rgba(22,64,108,0.06)] hover:-translate-y-1 hover:border-[#174b80]/20 hover:bg-white dark:border-white/10 dark:bg-[#0d1d31]/72 dark:text-[#f4f8ff] dark:hover:bg-[#10243d]',
                  )}
                  style={{ boxShadow: active ? `0 20px 60px ${route.accent}24` : undefined }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-5 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${route.accent}, transparent)`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="flex size-14 items-center justify-center rounded-[1.15rem] border text-[#071a35] shadow-[0_10px_26px_rgba(7,26,53,.08)]"
                      style={{ backgroundColor: route.wash }}
                    >
                      <Icon className="size-6" strokeWidth={1.8} />
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[9px] font-bold uppercase tracking-[0.16em]',
                        active ? 'text-white/58' : 'text-[#6b839b] dark:text-[#7891aa]',
                      )}
                    >
                      {count > 0 ? `${count} ${copy.coursesAvailable}` : copy.comingSoon}
                    </span>
                  </div>
                  <div className="mt-7 text-xl font-black tracking-[-0.035em]">
                    {copy.topicLabels[route.id]}
                  </div>
                  <div
                    className={cn(
                      'mt-1 text-sm',
                      active ? 'text-white/65' : 'text-[#607994] dark:text-[#91a9c0]',
                    )}
                  >
                    {copy.topicDescriptions[route.id]}
                  </div>
                  <div className="mt-5 flex items-center gap-2" aria-hidden="true">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: route.accent }}
                    />
                    <span
                      className={cn(
                        'h-px flex-1',
                        active ? 'bg-white/16' : 'bg-[#153b68]/10 dark:bg-white/10',
                      )}
                    />
                    <ArrowRight
                      className={cn(
                        'size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none',
                        active ? 'text-white/70' : 'text-[#315374] dark:text-[#91a9c0]',
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pt-20" aria-labelledby="age-home-title">
          <div className="overflow-hidden rounded-[2rem] border border-[#174b80]/10 bg-white/68 dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-px bg-[#174b80]/10 lg:grid-cols-[0.75fr_1.25fr] dark:bg-white/10">
              <div className="bg-[#071a35] p-8 text-white sm:p-10">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#71dce5]">
                  Choose by age
                </div>
                <h2 id="age-home-title" className="mt-3 text-3xl font-black tracking-[-0.05em]">
                  找到適合自己的起點
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#c5d9ed]">
                  首發集中在小四至中三；其他年齡路線會按閱讀能力、生活經驗與自主程度重新設計。
                </p>
              </div>
              <div className="grid bg-[#f6faff] sm:grid-cols-2 lg:grid-cols-3 dark:bg-[#0d1d31]">
                {siteContent?.ageBands.map((band) => (
                  <Link
                    key={band.id}
                    href={`/courses?age=${band.id}#series`}
                    className="group border-b border-r border-[#174b80]/10 p-5 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <div className="font-black">{band.title}</div>
                    <div className="mt-2 text-xs leading-5 text-[#607994] dark:text-[#91a9c0]">
                      {band.description}
                    </div>
                    <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-20" aria-labelledby="source-policy-home-title">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#35d7e1]/30 bg-[#dff9fa] p-8 sm:p-10 dark:bg-[#0b2c3c]">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 size-56 rounded-full border border-[#0e8793]/18"
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#0e7280] dark:text-[#71dce5]">
                  Source integrity
                </div>
                <h2
                  id="source-policy-home-title"
                  className="mt-3 text-3xl font-black tracking-[-0.05em]"
                >
                  {siteContent?.originalContentPolicy.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#315374] dark:text-[#b8ccde]">
                  {siteContent?.originalContentPolicy.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/standards"
                  className="rounded-full bg-[#071a35] px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-[#071a35]"
                >
                  課程依據
                </Link>
                <Link
                  href="/sources"
                  className="rounded-full border border-[#0e7280]/25 bg-white/65 px-5 py-3 text-sm font-black text-[#0c6570] dark:border-white/15 dark:bg-white/7 dark:text-white"
                >
                  資料來源
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="open-courses"
          className="scroll-mt-6 pt-20"
          aria-labelledby="open-courses-title"
        >
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
                {selectedRoute ? copy.topicLabels[selectedRoute.id] : copy.allCourses}
              </div>
              <h2
                id="open-courses-title"
                className="text-3xl font-black tracking-[-0.05em] sm:text-4xl"
              >
                {copy.courseSection}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
              {copy.courseSectionHint}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-[#174b80]/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#607994] dark:text-[#91a9c0]">
                <span className="size-2.5 animate-pulse rounded-full bg-[#35d7e1]" />
                {copy.loading}
              </div>
            </div>
          ) : failed ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-[#174b80]/10 bg-white/60 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-[#607994] dark:text-[#91a9c0]">{copy.emptyHint}</p>
              <button
                type="button"
                onClick={() => void loadCourses()}
                className="rounded-full bg-[#071a35] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] focus-visible:ring-offset-2 motion-reduce:transform-none dark:bg-[#f4f8ff] dark:text-[#071a35]"
              >
                {copy.retry}
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#174b80]/20 bg-white/40 px-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
              <h3 className="text-xl font-bold">{copy.emptyTitle}</h3>
              <p className="mt-2 text-sm text-[#607994] dark:text-[#91a9c0]">{copy.emptyHint}</p>
            </div>
          ) : visibleCourses.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#174b80]/20 bg-white/45 px-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
              <div
                className="mb-4 flex size-12 items-center justify-center rounded-2xl text-[#071a35]"
                style={{ backgroundColor: selectedRoute?.wash }}
              >
                {selectedRoute ? <selectedRoute.icon className="size-5" /> : null}
              </div>
              <p className="max-w-md text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
                {copy.noCoursesForRoute}
              </p>
              <button
                type="button"
                onClick={() => setActiveTopic('all')}
                className="mt-5 rounded-full border border-[#071a35]/15 bg-white px-4 py-2 text-sm font-bold text-[#071a35] transition hover:border-[#1847d6]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:border-white/15 dark:bg-white/5 dark:text-white"
              >
                {copy.allCourses}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => {
                const thumbnail = thumbnails[course.id];
                const primaryRoute = routeForCourse(course);
                const lessonLabel = course.lessonNumber
                  ? copy.lessonLabel.replace('{number}', String(course.lessonNumber))
                  : null;

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => router.push(`/classroom/${encodeURIComponent(course.id)}`)}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-[#174b80]/10 bg-white text-left shadow-[0_18px_45px_rgba(22,64,108,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#174b80]/20 hover:shadow-[0_28px_65px_rgba(22,64,108,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:border-white/10 dark:bg-[#0d1d31] dark:focus-visible:ring-offset-[#07111f]"
                    aria-label={`${copy.openCourse}: ${course.name}`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 z-20 h-1"
                      style={{ backgroundColor: primaryRoute.accent }}
                    />
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#dbe8f5] dark:bg-[#102b4e]">
                      {thumbnail ? (
                        <SlideThumbnail
                          slide={thumbnail}
                          viewportRatio={thumbnail.viewportRatio ?? 0.5625}
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at 72% 28%, ${primaryRoute.accent} 0, transparent 30%), linear-gradient(135deg, #102b4e, #225f9f)`,
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061427]/70 via-transparent to-transparent" />
                      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                        <div className="rounded-full bg-[#071a35]/78 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-white backdrop-blur-md">
                          {course.sceneCount} {copy.lessonUnit}
                        </div>
                        <div
                          className="size-2.5 rounded-full shadow-[0_0_18px_currentColor]"
                          style={{
                            backgroundColor: primaryRoute.accent,
                            color: primaryRoute.accent,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#58728d] dark:text-[#8da6be]">
                        {course.series ? <span>{course.series}</span> : null}
                        {course.series && lessonLabel ? <span aria-hidden="true">/</span> : null}
                        {lessonLabel ? <span>{lessonLabel}</span> : null}
                      </div>
                      <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em]">
                        {course.name}
                      </h3>
                      {course.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
                          {course.description}
                        </p>
                      ) : null}

                      <div className="mt-5 grid gap-2">
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e8f0f8] px-3 py-1.5 text-[10px] font-bold text-[#315374] dark:bg-white/8 dark:text-[#b3c7da]">
                          <GraduationCap className="size-3" />
                          適合年級：
                          {course.gradeRange ??
                            course.audiences
                              ?.map((audience) => copy.audienceLabels[audience])
                              .join('、') ??
                            '待公佈'}
                        </span>
                        {course.language ? (
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e8f0f8] px-3 py-1.5 text-[10px] font-bold text-[#315374] dark:bg-white/8 dark:text-[#b3c7da]">
                            <Languages className="size-3" />
                            課程語言：{copy.languageLabels[course.language]}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-[#174b80]/10 pt-4 text-sm font-bold dark:border-white/10">
                        <span>
                          {course.lessonNumber === 1 ? '免費試聽第 1 節' : copy.openCourse}
                        </span>
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#071a35] text-white transition-transform group-hover:translate-x-1 motion-reduce:transform-none dark:bg-[#f4f8ff] dark:text-[#071a35]">
                          <ArrowRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <LearnerSiteFooter />
      </div>
    </main>
  );
}
