import type { LucideIcon } from 'lucide-react';

export function LearnerPageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#1c64b7]/22 bg-[#071a35] px-6 py-12 text-white shadow-[0_28px_90px_rgba(5,36,78,0.2)] sm:px-10 sm:py-16 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute -right-28 -top-32 size-[30rem] rounded-full border border-[#35d7e1]/25 shadow-[inset_0_0_80px_rgba(53,215,225,0.08)]"
      />
      <div aria-hidden="true" className="absolute right-16 top-16 hidden lg:block">
        <div className="relative size-32 rounded-full border border-white/12">
          <span className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#35d7e1]/70 to-transparent" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-[#35d7e1]/70 to-transparent" />
          <span className="absolute left-[67%] top-[29%] size-2.5 rounded-full bg-[#35d7e1] shadow-[0_0_18px_#35d7e1]" />
        </div>
      </div>
      <div className="relative max-w-4xl">
        <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8ef2f6]">
          <Icon className="size-4" />
          {eyebrow}
        </div>
        <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[#d7e7f7] sm:text-lg">
          {description}
        </p>
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
