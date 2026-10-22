import { Compass, Cpu, Landmark, MessageCircle, Sparkles, Users, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { LearnerCourseTopic } from '@/lib/learner/public-courses';
import type { LearnerSeriesDefinition } from '@/lib/learner/site-content';
import { cn } from '@/lib/utils';

interface ArtworkTheme {
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly glow: string;
  readonly wash: string;
  readonly label: string;
}

const ARTWORK_THEMES: Record<LearnerCourseTopic, ArtworkTheme> = {
  'ai-tech': {
    icon: Cpu,
    accent: '#46e3eb',
    glow: '#157caa',
    wash: '#0b2949',
    label: 'AI LAB',
  },
  chinese: {
    icon: MessageCircle,
    accent: '#ff8b6d',
    glow: '#d14c78',
    wash: '#351d35',
    label: 'VOICE LAB',
  },
  'hong-kong': {
    icon: Landmark,
    accent: '#ffca62',
    glow: '#df6f43',
    wash: '#3b2830',
    label: 'HK FIELD',
  },
  leadership: {
    icon: Users,
    accent: '#ab95ff',
    glow: '#5f52d9',
    wash: '#252450',
    label: 'LEAD LAB',
  },
  'life-money': {
    icon: WalletCards,
    accent: '#65dda2',
    glow: '#278b7b',
    wash: '#123d3c',
    label: 'LIFE LAB',
  },
  interests: {
    icon: Compass,
    accent: '#77a9ff',
    glow: '#3856c5',
    wash: '#172d59',
    label: 'MAKER LAB',
  },
};

export function artworkThemeForSeries(series: LearnerSeriesDefinition): ArtworkTheme {
  return ARTWORK_THEMES[series.topics[0] ?? 'ai-tech'];
}

export function SeriesArtwork({
  series,
  className,
}: {
  readonly series: LearnerSeriesDefinition;
  readonly className?: string;
}) {
  const theme = artworkThemeForSeries(series);
  const Icon = theme.icon;

  return (
    <div
      role="img"
      aria-label={`${series.title}課程主題圖示`}
      className={cn('relative isolate h-full min-h-40 overflow-hidden', className)}
      style={{
        background: `radial-gradient(circle at 72% 24%, ${theme.glow} 0, transparent 31%), linear-gradient(135deg, #071a35 0%, ${theme.wash} 100%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-20 size-64 rounded-full border opacity-45"
        style={{ borderColor: `${theme.accent}66` }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 right-12 size-56 rounded-full border opacity-25"
        style={{ borderColor: theme.accent }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:28px_28px]"
      />

      <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4">
        <span
          className="rounded-full border px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.2em]"
          style={{ borderColor: `${theme.accent}66`, color: theme.accent }}
        >
          {theme.label}
        </span>
        <Sparkles className="size-4" style={{ color: theme.accent }} />
      </div>

      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-5">
        <div>
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-white/45">
            Learning signal
          </div>
          <div className="mt-2 h-px w-24" style={{ backgroundColor: `${theme.accent}99` }} />
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {[0.4, 0.7, 1].map((opacity) => (
              <span
                key={opacity}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: theme.accent, opacity }}
              />
            ))}
          </div>
        </div>
        <span
          className="flex size-20 items-center justify-center rounded-[1.75rem] border shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-sm"
          style={{
            borderColor: `${theme.accent}66`,
            backgroundColor: `${theme.accent}18`,
            color: theme.accent,
          }}
        >
          <Icon className="size-9" strokeWidth={1.7} />
        </span>
      </div>
    </div>
  );
}
