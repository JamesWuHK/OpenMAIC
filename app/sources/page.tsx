import type { Metadata } from 'next';
import { ArrowUpRight, Database, RefreshCw } from 'lucide-react';

import { LearnerPageHero } from '@/components/learner/learner-page-hero';
import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';

export const metadata: Metadata = {
  title: '資料來源｜万里 AI 課堂',
  description: '查看課程研究依據、復核日期與万里 AI 課堂的原創內容政策。',
};

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  const { sources, originalContentPolicy } = await readLearnerSiteContent();
  return (
    <LearnerPageShell>
      <LearnerPageHero
        eyebrow="SOURCE LEDGER"
        title="每個事實有來處，每個課堂有自己的說法"
        description="這裡公開我們研究時查閱的主要資料及復核日期。它們是核對事實的起點，不是可以直接搬進課堂的素材庫。"
        icon={Database}
      />

      <section className="pt-16" aria-labelledby="policy-title">
        <div className="grid gap-6 rounded-[1.8rem] border border-[#174b80]/10 bg-white/72 p-7 lg:grid-cols-[0.85fr_1.15fr] lg:p-10 dark:border-white/10 dark:bg-white/5">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
              Our source rule
            </div>
            <h2 id="policy-title" className="mt-3 text-3xl font-black tracking-[-0.05em]">
              {originalContentPolicy.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
              {originalContentPolicy.summary}
            </p>
          </div>
          <ol className="grid gap-3">
            {originalContentPolicy.rules.map((rule, index) => (
              <li
                key={rule}
                className="grid grid-cols-[34px_1fr] gap-3 rounded-2xl bg-[#edf4fb] p-4 text-sm leading-6 dark:bg-white/6"
              >
                <span className="font-mono text-xs font-black text-[#1847d6] dark:text-[#71dce5]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pt-16" aria-labelledby="ledger-title">
        <div className="mb-8">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
            Reviewed sources
          </div>
          <h2 id="ledger-title" className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            主要研究資料
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
            外部連結只供家長、教師與學生追溯資料。網站不載入或重新發佈這些機構的圖片與頁面內容。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[1.5rem] border border-[#174b80]/10 bg-white/78 p-6 transition hover:-translate-y-0.5 hover:border-[#174b80]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:border-white/10 dark:bg-[#0d1d31]/78"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1847d6] dark:text-[#71dce5]">
                    {source.organisation}
                  </div>
                  <h3 className="mt-2 text-lg font-black">{source.title}</h3>
                </div>
                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
                {source.use}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-[#174b80]/10 pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#6b839b] dark:border-white/10 dark:text-[#7891aa]">
                <RefreshCw className="size-3" />
                最近復核 {source.reviewedAt}
              </div>
            </a>
          ))}
        </div>
      </section>
    </LearnerPageShell>
  );
}
