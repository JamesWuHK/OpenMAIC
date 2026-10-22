import type { Metadata } from 'next';

import { LearnerPageShell } from '@/components/learner/learner-site-chrome';
import { SubmissionReviewQueue } from '@/components/learner/submission-review-queue';

export const metadata: Metadata = {
  title: '課程投稿審核｜万里 AI 課堂',
  robots: { index: false, follow: false },
};

export default function ReviewSubmissionsPage() {
  return (
    <LearnerPageShell>
      <section className="rounded-[2.5rem] bg-[#071a35] p-8 text-white sm:p-12">
        <div className="font-mono text-[10px] font-black tracking-[.2em] text-[#71dce5]">
          PRIVATE REVIEW DESK
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">先判斷，再生成</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#bcd1e5]">
          只有你批准的投稿，才會進入 OpenMAIC
          課堂生成隊列。請核對學習目標、來源權利、事實邊界及是否適合學生。
        </p>
      </section>
      <section className="mt-8">
        <SubmissionReviewQueue />
      </section>
    </LearnerPageShell>
  );
}
