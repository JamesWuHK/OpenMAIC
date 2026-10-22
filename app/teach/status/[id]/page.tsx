'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Clock3, FileText } from 'lucide-react';

import { LearnerPageShell } from '@/components/learner/learner-site-chrome';

const LABELS: Record<string, string> = {
  pending_review: '等待人工審核',
  changes_requested: '需要補充資料',
  queued_for_generation: '審核通過，等待生成',
  submitting_generation: '正在整理資料並提交生成',
  generating: '正在製作課堂',
  generated: '課堂已生成，等待發布審核',
  generation_failed: '生成需要人工處理',
  published: '課堂已發布',
  rejected: '本次未獲採用',
};

interface PublicSubmissionStatus {
  id: string;
  courseTitle: string;
  status: string;
  reviewNote?: string;
  generationProgress?: number;
  generationStep?: string;
  generationFailed?: boolean;
  generatedClassroomUrl?: string;
  files: Array<{ category: string; originalName: string; bytes: number }>;
}

export default function SubmissionStatusPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSearchParams().get('token') || '';
  const [data, setData] = useState<PublicSubmissionStatus | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/teacher-submissions/${id}?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('找不到投稿，請使用提交成功頁提供的完整連結。');
        return r.json();
      })
      .then((r) => setData(r.submission))
      .catch((e) => setError(e.message));
  }, [id, token]);
  return (
    <LearnerPageShell>
      <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-[#174b80]/10 bg-white/85 p-7 shadow-[0_28px_90px_rgba(7,26,53,.1)] sm:p-12 dark:border-white/10 dark:bg-white/[.055]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#dff9fa] text-[#087f8a] dark:bg-[#123d4b]">
          <Clock3 />
        </div>
        <div className="mt-6 font-mono text-[10px] font-black tracking-[.2em] text-[#159ca8]">
          SUBMISSION STATUS
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-.055em]">投稿進度</h1>
        {error ? (
          <p className="mt-8 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>
        ) : !data ? (
          <p className="mt-8 text-[#6b839b]">正在讀取…</p>
        ) : (
          <div className="mt-8">
            <div className="rounded-2xl bg-[#071a35] p-6 text-white">
              <div className="text-xs text-white/55">{data.id}</div>
              <h2 className="mt-2 text-2xl font-black">{data.courseTitle}</h2>
              <div className="mt-4 inline-flex rounded-full bg-[#35d7e1] px-3 py-1.5 text-xs font-black text-[#071a35]">
                {LABELS[data.status] || data.status}
              </div>
              {typeof data.generationProgress === 'number' ? (
                <div className="mt-4 text-sm text-white/70">
                  生成進度 {data.generationProgress}%
                  {data.generationStep ? ` · ${data.generationStep}` : ''}
                </div>
              ) : null}
            </div>
            {data.generatedClassroomUrl ? (
              <a
                href={data.generatedClassroomUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-[#1847d6] px-5 py-3 text-sm font-black text-white"
              >
                預覽已生成課堂
              </a>
            ) : null}
            {data.generationFailed ? (
              <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                生成暫未完成，管理員會跟進；你的投稿不會自動重複提交。
              </p>
            ) : null}
            {data.reviewNote ? (
              <div className="mt-5 rounded-2xl border border-[#f5b941]/30 bg-[#fff8e8] p-5 dark:bg-[#3c2d12]">
                <div className="text-xs font-black">審核備註</div>
                <p className="mt-2 text-sm leading-6">{data.reviewNote}</p>
              </div>
            ) : null}
            <div className="mt-6 space-y-2">
              {data.files.map((file) => (
                <div
                  key={file.originalName}
                  className="flex items-center gap-3 rounded-xl border border-[#174b80]/10 p-3"
                >
                  <FileText className="size-4 text-[#1847d6]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">
                    {file.originalName}
                  </span>
                  <span className="text-xs text-[#6b839b]">{Math.ceil(file.bytes / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </LearnerPageShell>
  );
}
