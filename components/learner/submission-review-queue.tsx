'use client';

import { useState } from 'react';
import { Check, KeyRound, Loader2, RefreshCw, RotateCcw, X } from 'lucide-react';

type Submission = {
  id: string;
  createdAt: string;
  status: string;
  teacherName: string;
  email: string;
  courseTitle: string;
  subject: string;
  gradeBand: string;
  teachingLanguage: string;
  lessonDuration: string;
  learningGoals: string;
  teacherNotes: string;
  reviewNote?: string;
  generationProgress?: number;
  generationStep?: string;
  generationError?: string;
  generatedClassroomUrl?: string;
  files: Array<{ id: string; category: string; originalName: string; bytes: number }>;
};

export function SubmissionReviewQueue() {
  const [key, setKey] = useState('');
  const [rows, setRows] = useState<Submission[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/teacher-submissions', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(r.status === 401 ? '審核密鑰不正確。' : '未能讀取隊列。');
      setRows((await r.json()).submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未能讀取隊列。');
    } finally {
      setLoading(false);
    }
  }
  async function decide(id: string, decision: 'approve' | 'changes' | 'reject') {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/teacher-submissions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewNote: notes[id] || '' }),
      });
      if (!r.ok) throw new Error('未能儲存審核決定。');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '未能儲存審核決定。');
      setLoading(false);
    }
  }
  async function download(submissionId: string, file: Submission['files'][number]) {
    setError('');
    try {
      const response = await fetch(`/api/teacher-submissions/${submissionId}/files/${file.id}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!response.ok) throw new Error('未能下載審核資料。');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '未能下載審核資料。');
    }
  }
  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-[#174b80]/12 bg-white p-4 sm:flex-row dark:border-white/10 dark:bg-white/5">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <KeyRound className="size-4 text-[#1847d6]" />
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="輸入審核密鑰"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <button
          onClick={load}
          disabled={!key || loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071a35] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40 dark:bg-[#71dce5] dark:text-[#071a35]"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          讀取隊列
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 space-y-5">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-[1.75rem] border border-[#174b80]/10 bg-white/90 p-6 shadow-[0_18px_55px_rgba(7,26,53,.07)] dark:border-white/10 dark:bg-white/[.055]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] font-black tracking-[.15em] text-[#159ca8]">
                  {row.status.replaceAll('_', ' ').toUpperCase()}
                </div>
                <h2 className="mt-2 text-2xl font-black">{row.courseTitle}</h2>
                <p className="mt-1 text-sm text-[#6b839b]">
                  {row.subject} · {row.gradeBand} · {row.teachingLanguage} ·{' '}
                  {row.lessonDuration || '課時未填'}
                </p>
              </div>
              <div className="text-right text-xs text-[#6b839b]">
                <div>{row.teacherName}</div>
                <div>{row.email}</div>
                <div className="mt-1">{new Date(row.createdAt).toLocaleString('zh-HK')}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#eef4fb] p-4 dark:bg-[#09192b]">
                <div className="text-xs font-black">學習目標</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.learningGoals}</p>
              </div>
              <div className="rounded-2xl bg-[#eef4fb] p-4 dark:bg-[#09192b]">
                <div className="text-xs font-black">補充說明</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {row.teacherNotes || '沒有補充說明'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => download(row.id, file)}
                  className="rounded-full border border-[#174b80]/12 px-3 py-1.5 text-xs font-bold"
                >
                  下載 {file.originalName} · {Math.ceil(file.bytes / 1024)} KB
                </button>
              ))}
            </div>
            {row.generatedClassroomUrl ? (
              <a
                href={row.generatedClassroomUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-[#1847d6] px-4 py-2.5 text-xs font-black text-white"
              >
                開啟生成結果
              </a>
            ) : null}
            {row.generationStep || typeof row.generationProgress === 'number' ? (
              <p className="mt-4 text-xs font-bold text-[#6b839b]">
                生成狀態：{row.generationStep || '處理中'}
                {typeof row.generationProgress === 'number' ? ` · ${row.generationProgress}%` : ''}
              </p>
            ) : null}
            {row.generationError ? (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {row.generationError}
              </p>
            ) : null}
            <textarea
              value={notes[row.id] ?? row.reviewNote ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
              placeholder="審核意見；要求補充資料時請寫清楚要改甚麼。"
              rows={3}
              className="mt-5 w-full rounded-2xl border border-[#174b80]/15 bg-[#f7faff] px-4 py-3 text-sm outline-none focus:border-[#1847d6] dark:border-white/15 dark:bg-[#09192b]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => decide(row.id, 'approve')}
                disabled={loading || !['pending_review', 'changes_requested'].includes(row.status)}
                className="inline-flex items-center gap-2 rounded-full bg-[#159ca8] px-4 py-2.5 text-xs font-black text-white disabled:opacity-35"
              >
                <Check className="size-4" />
                批准並排隊生成
              </button>
              <button
                onClick={() => decide(row.id, 'changes')}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#f5b941] px-4 py-2.5 text-xs font-black text-[#071a35] disabled:opacity-35"
              >
                <RotateCcw className="size-4" />
                要求補充
              </button>
              <button
                onClick={() => decide(row.id, 'reject')}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2.5 text-xs font-black text-red-700 disabled:opacity-35 dark:text-red-300"
              >
                <X className="size-4" />
                不採用
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
