import type { Metadata } from 'next';
import { FileCheck2, ScanSearch, Sparkles } from 'lucide-react';

import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { TeacherSubmissionForm } from '@/components/learner/teacher-submission-form';

export const metadata: Metadata = {
  title: '教師投稿｜万里 AI 課堂',
  description: '提交一節課的教案與資料，通過人工審核後再生成 AI 互動課堂。',
};

export default function TeachPage() {
  return (
    <LearnerPageShell>
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#071a35] px-7 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
        <div className="absolute right-[-4rem] top-[-6rem] size-72 rounded-full border-[42px] border-[#35d7e1]/15" />
        <div className="relative max-w-3xl">
          <div className="font-mono text-[10px] font-black tracking-[.2em] text-[#71dce5]">
            TEACHER INBOX · HUMAN REVIEW FIRST
          </div>
          <h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.065em] sm:text-7xl">
            把你的教案，變成一節會互動的課
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#d3e5f6] sm:text-lg">
            你提供教學判斷和可靠資料，我們負責把它整理成適合學生參與的 AI
            課堂。每一份投稿都先由人審核，不會直接交給模型生成。
          </p>
        </div>
        <div className="relative mt-10 grid gap-3 sm:grid-cols-3">
          {[
            [FileCheck2, '提交資料', '教案、參考文檔、作業'],
            [ScanSearch, '人工審核', '目標、版權、準確性與安全'],
            [Sparkles, '排隊生成', '批准後才進入製作隊列'],
          ].map(([Icon, title, body]) => {
            const C = Icon as typeof FileCheck2;
            return (
              <div
                key={String(title)}
                className="rounded-2xl border border-white/12 bg-white/7 p-4 backdrop-blur"
              >
                <C className="size-5 text-[#71dce5]" />
                <div className="mt-3 font-black">{String(title)}</div>
                <div className="mt-1 text-xs text-white/60">{String(body)}</div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mx-auto mt-10 max-w-5xl">
        <TeacherSubmissionForm />
      </section>
    </LearnerPageShell>
  );
}
