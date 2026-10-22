import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2 } from 'lucide-react';

import { LearnerPageHero } from '@/components/learner/learner-page-hero';
import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { readLearnerSiteContent } from '@/lib/learner/site-content.server';

export const metadata: Metadata = {
  title: '課程依據｜万里 AI 課堂',
  description: '了解万里 AI 課堂如何把香港教育框架轉化為原創互動學習任務。',
};

export const dynamic = 'force-dynamic';

export default async function StandardsPage() {
  const { originalContentPolicy, standardsAlignment } = await readLearnerSiteContent();
  return (
    <LearnerPageShell>
      <LearnerPageHero
        eyebrow="LEARNING COMPASS"
        title="框架給方向，課堂重新創作"
        description="我們用香港教育文件校準學習目標，再把抽象能力轉化為學生可以提問、判斷、行動和完成作品的任務。"
        icon={BookOpenCheck}
      >
        <Link
          href="/sources"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071a35]"
        >
          查看資料來源
          <ArrowRight className="size-4" />
        </Link>
      </LearnerPageHero>

      <section className="pt-16" aria-labelledby="alignment-title">
        <div className="mb-8 max-w-3xl">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1847d6] dark:text-[#71dce5]">
            From framework to action
          </div>
          <h2
            id="alignment-title"
            className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl"
          >
            學生真正會做的四件事
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {standardsAlignment.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.65rem] border border-[#174b80]/10 bg-white/75 p-7 shadow-[0_14px_38px_rgba(22,64,108,0.06)] dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-xs font-bold text-[#1847d6] dark:text-[#71dce5]">
                {item.framework}
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="pt-16" aria-labelledby="language-title">
        <div className="grid gap-px overflow-hidden rounded-[1.8rem] border border-[#174b80]/10 bg-[#174b80]/10 lg:grid-cols-3 dark:border-white/10 dark:bg-white/10">
          <div className="bg-[#071a35] p-8 text-white lg:col-span-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#71dce5]">
              Language design
            </div>
            <h2 id="language-title" className="mt-3 text-3xl font-black tracking-[-0.05em]">
              不同語言，不共用一份稿
            </h2>
          </div>
          <div className="bg-white/85 p-8 dark:bg-[#0d1d31]">
            <h3 className="font-black">學生閱讀</h3>
            <p className="mt-3 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
              使用清楚的正體書面中文，保留香港常用詞與真實生活語境。
            </p>
          </div>
          <div className="bg-white/85 p-8 dark:bg-[#0d1d31]">
            <h3 className="font-black">學生聆聽</h3>
            <p className="mt-3 text-sm leading-7 text-[#607994] dark:text-[#91a9c0]">
              粵語、普通話與英文分別撰寫口語稿，避免用普通話句式硬套粵語音色。
            </p>
          </div>
        </div>
      </section>

      <section className="pt-16" aria-labelledby="original-title">
        <div className="rounded-[2rem] border border-[#35d7e1]/30 bg-[#dff9fa] p-7 sm:p-10 dark:bg-[#0b2c3c]">
          <div className="max-w-3xl">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#0e7280] dark:text-[#71dce5]">
              Editorial rule
            </div>
            <h2 id="original-title" className="mt-3 text-3xl font-black tracking-[-0.05em]">
              {originalContentPolicy.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#315374] dark:text-[#b8ccde]">
              {originalContentPolicy.summary}
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {originalContentPolicy.rules.map((rule) => (
              <div
                key={rule}
                className="flex gap-3 rounded-2xl bg-white/72 p-4 text-sm leading-6 dark:bg-white/7"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0e8793] dark:text-[#71dce5]" />
                {rule}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-5 text-xs leading-5 text-[#6b839b] dark:text-[#7891aa]">
          「依據」表示教學設計參考相關公開資料，不表示課程由香港教育局或任何公共機構製作、認可或推薦。
        </p>
      </section>
    </LearnerPageShell>
  );
}
