'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const choices = [
  '先寫下已知線索、未知問題，再找可靠資料',
  '凭第一感覺猜一個答案',
  '直接複製 AI 或網上的第一個答案',
] as const;

export function FirstLessonExperience({
  question,
  artifact,
}: {
  readonly question: string;
  readonly artifact: string;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const isCorrect = choice === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-[2rem] border border-[#174b80]/10 bg-white p-7 shadow-[0_20px_55px_rgba(22,64,108,.08)] dark:border-white/10 dark:bg-[#0d1d31] sm:p-9">
        <div className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-[#1847d6] dark:text-[#71dce5]">
          互動挑戰 01
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em]">你會先做哪一步？</h2>
        <p className="mt-4 text-base font-bold leading-7 text-[#315374] dark:text-[#c5d9ed]">
          今天我們要回應：「{question}」
        </p>
        <div className="mt-7 space-y-3">
          {choices.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setChoice(index)}
              className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-bold leading-6 transition ${
                choice === index
                  ? 'border-[#1847d6] bg-[#e8f1ff] text-[#071a35] dark:border-[#71dce5] dark:bg-[#153653] dark:text-white'
                  : 'border-[#174b80]/10 bg-[#f7fbff] text-[#315374] hover:border-[#1847d6]/35 dark:border-white/10 dark:bg-white/5 dark:text-[#b3c7da]'
              }`}
            >
              <span className="mr-3 font-mono text-xs">{String.fromCharCode(65 + index)}</span>
              {item}
            </button>
          ))}
        </div>
        {choice !== null ? (
          <div
            className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-6 ${
              isCorrect
                ? 'bg-[#ddf8f3] text-[#075b52] dark:bg-[#123f3b] dark:text-[#9ff2e6]'
                : 'bg-[#fff2eb] text-[#8a3a24] dark:bg-[#3b241f] dark:text-[#ffc0ae]'
            }`}
          >
            {isCorrect
              ? '很好。可靠的判斷從「我知道甚麼、還要查甚麼」開始。'
              : '先不要急著定答案。試著把問題拆成已知線索和待查證部分。'}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] bg-[#071a35] p-7 text-white sm:p-9">
        <div className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-[#71dce5]">
          本課任務
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em]">做出第一張思考卡</h2>
        <ol className="mt-7 space-y-4 text-sm font-bold leading-6 text-[#c5d9ed]">
          <li>1. 寫下一個你已知的線索。</li>
          <li>2. 標記一個仍需查證的地方。</li>
          <li>3. 說明你會用什麼資料或測試方法。</li>
        </ol>
        <div className="mt-7 rounded-2xl border border-white/12 bg-white/8 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-[#8ef2f6]">
            <CheckCircle2 className="size-4" />
            系列最終作品
          </div>
          <p className="mt-2 text-sm leading-6 text-white/75">{artifact}</p>
        </div>
        {choice !== null ? (
          <button
            type="button"
            onClick={() => setChoice(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/18 px-4 py-2 text-xs font-black text-white"
          >
            <RotateCcw className="size-3.5" />
            再想一次
          </button>
        ) : null}
      </section>
    </div>
  );
}
