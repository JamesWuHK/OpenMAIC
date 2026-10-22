import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';

import { OPENMAIC_MIT_LICENSE, OPEN_SOURCE_COMPONENTS } from '@/lib/legal/open-source-notices';

export const metadata: Metadata = {
  title: '開源軟件聲明 | 万里 AI 課堂',
  description: '万里 AI 課堂所使用的主要開源軟件、版權與許可條款。',
};

export default function OpenSourceLicensesPage() {
  return (
    <main className="min-h-screen bg-[#eef4fb] text-[#071a35] dark:bg-[#07111f] dark:text-[#f4f8ff]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-55 [background-image:linear-gradient(rgba(14,71,129,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(14,71,129,0.055)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-20"
      />

      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
        <nav className="flex items-center justify-between rounded-[1.35rem] border border-[#071a35]/10 bg-white/82 px-4 py-3 shadow-[0_10px_35px_rgba(24,71,122,0.08)] backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-[#0d1d31]/82">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#315374] transition hover:bg-[#dce8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:text-[#b1c5d9] dark:hover:bg-white/10"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回課堂
          </Link>
          <span className="text-lg font-black tracking-[-0.05em]">wanli.ai</span>
        </nav>

        <header className="pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1847d6]/15 bg-white/70 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:border-[#71dce5]/20 dark:bg-white/5 dark:text-[#71dce5]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Open-source notices
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
            開源軟件聲明
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#45617e] dark:text-[#a8bdd1]">
            万里 AI 課堂使用了開源軟件。我們在這裡保留相關版權聲明與許可條款，感謝開源社群的貢獻。
          </p>
          <p className="mt-4 max-w-2xl border-l-2 border-[#35d7e1] pl-4 text-sm leading-6 text-[#607994] dark:text-[#91a9c0]">
            万里 AI 課堂由万里團隊獨立運營，並非 THU-MAIC 官方服務。
          </p>
        </header>

        <section aria-labelledby="components-title">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#174b80]/12 pb-4 dark:border-white/10">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1847d6] dark:text-[#71dce5]">
                Component register
              </div>
              <h2 id="components-title" className="mt-2 text-2xl font-black tracking-[-0.04em]">
                主要開源組件
              </h2>
            </div>
            <FileText className="size-6 text-[#6b839b]" aria-hidden="true" />
          </div>

          <div className="grid gap-3">
            {OPEN_SOURCE_COMPONENTS.map((component) => (
              <article
                key={component.name}
                className="grid gap-5 rounded-[1.4rem] border border-[#174b80]/10 bg-white/76 p-5 shadow-[0_12px_35px_rgba(22,64,108,0.05)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6 dark:border-white/10 dark:bg-[#0d1d31]/72"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black tracking-[-0.03em]">{component.name}</h3>
                    <span className="rounded-full bg-[#dce8f5] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#315374] dark:bg-white/10 dark:text-[#b3c7da]">
                      {component.license}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#607994] dark:text-[#91a9c0]">
                    {component.role} · {component.copyright}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <a
                    href={component.licenseUrl}
                    className="rounded-full border border-[#071a35]/12 px-4 py-2 text-xs font-bold transition hover:border-[#1847d6]/35 hover:bg-[#eef4fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:border-white/15 dark:hover:bg-white/10"
                  >
                    查看許可原文
                  </a>
                  <a
                    href={component.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#071a35] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#12345e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6] dark:bg-[#f4f8ff] dark:text-[#071a35]"
                  >
                    原始專案
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-16 pt-14" aria-labelledby="mit-license-title">
          <div className="rounded-[1.6rem] border border-[#174b80]/10 bg-[#071a35] p-5 text-[#d7e7f7] shadow-[0_28px_80px_rgba(5,36,78,0.18)] sm:p-8 dark:border-white/10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#71dce5]">
                  Preserved license text
                </div>
                <h2 id="mit-license-title" className="mt-2 text-xl font-black text-white">
                  OpenMAIC · MIT License
                </h2>
              </div>
              <span className="rounded-full border border-white/12 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/65">
                Copyright 2026 THU-MAIC
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-[#b9ccdf] sm:text-xs">
              {OPENMAIC_MIT_LICENSE}
            </pre>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#174b80]/12 py-6 text-xs text-[#6b839b] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-[#7891aa]">
          <span>© 2026 万里 AI 課堂</span>
          <span>許可聲明不表示開源作者對本服務的背書。</span>
        </footer>
      </div>
    </main>
  );
}
