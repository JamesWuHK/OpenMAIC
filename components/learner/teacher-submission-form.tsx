'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Paperclip, ShieldCheck } from 'lucide-react';

const FILE_GROUPS = [
  { name: 'lesson_plan', label: '教案', hint: '課堂流程、教學重點、時間安排' },
  { name: 'reference', label: '參考資料', hint: '文章、講義、簡報、數據或圖片' },
  { name: 'assignment', label: '作業與評量', hint: '工作紙、題目、評分準則或示例' },
  { name: 'other', label: '其他補充', hint: '希望 AI 理解的其他課程材料' },
] as const;

export function TeacherSubmissionForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; trackingToken: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/teacher-submissions', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '資料未能送出，請稍後再試。');
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '資料未能送出，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const statusUrl = `/teach/status/${result.id}?token=${encodeURIComponent(result.trackingToken)}`;
    return (
      <section className="rounded-[2rem] border border-[#35d7e1]/35 bg-white p-7 shadow-[0_28px_80px_rgba(7,26,53,.12)] sm:p-10 dark:bg-[#10233b]">
        <CheckCircle2 className="size-12 text-[#159ca8]" />
        <div className="mt-5 font-mono text-xs font-black tracking-[0.18em] text-[#159ca8]">
          RECEIVED
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">已進入審核隊列</h2>
        <p className="mt-4 max-w-xl leading-7 text-[#4e6b88] dark:text-[#a8bed3]">
          我們不會立即生成課堂。管理員完成內容、版權與學生安全審核後，才會把這份資料送入生成隊列。
        </p>
        <div className="mt-6 rounded-2xl bg-[#eef4fb] p-4 font-mono text-xs text-[#315374] dark:bg-white/5 dark:text-[#b8cde0]">
          投稿編號：{result.id}
        </div>
        <a
          href={statusUrl}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#071a35] px-5 py-3 text-sm font-black text-white dark:bg-[#71dce5] dark:text-[#071a35]"
        >
          查看審核進度 <ArrowRight className="size-4" />
        </a>
        <p className="mt-4 text-xs text-[#6b839b]">
          請收藏狀態頁；其中包含只供本次投稿使用的查詢憑證。
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="rounded-[2rem] border border-[#174b80]/10 bg-white/85 p-6 shadow-[0_24px_70px_rgba(7,26,53,.08)] sm:p-9 dark:border-white/10 dark:bg-white/[.055]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1847d6] font-mono text-xs font-black text-white">
            01
          </span>
          <div>
            <h2 className="text-xl font-black">這節課教甚麼？</h2>
            <p className="text-sm text-[#6b839b]">先讓審核者理解課程目的與學生對象。</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="課程名稱"
            name="courseTitle"
            required
            placeholder="例如：用天氣數據讀懂一場暴雨"
          />
          <Field
            label="學科／主題"
            name="subject"
            required
            placeholder="例如：科學、中文、AI 素養"
          />
          <Field label="適合年級" name="gradeBand" required placeholder="例如：小五至中一" />
          <Field
            label="授課語言"
            name="teachingLanguage"
            required
            placeholder="例如：香港粵語＋繁體中文"
          />
          <Field label="預計課時" name="lessonDuration" placeholder="例如：45 分鐘" />
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-black">核心學習目標 *</span>
          <textarea
            name="learningGoals"
            required
            rows={5}
            maxLength={4000}
            placeholder="完成這節課後，學生應該能夠……"
            className="mt-2 w-full rounded-2xl border border-[#174b80]/15 bg-[#f7faff] px-4 py-3 text-sm leading-6 outline-none focus:border-[#1847d6] focus:ring-2 focus:ring-[#1847d6]/15 dark:border-white/15 dark:bg-[#09192b]"
          />
        </label>
      </section>

      <section className="rounded-[2rem] border border-[#174b80]/10 bg-white/85 p-6 shadow-[0_24px_70px_rgba(7,26,53,.08)] sm:p-9 dark:border-white/10 dark:bg-white/[.055]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#35d7e1] font-mono text-xs font-black text-[#071a35]">
            02
          </span>
          <div>
            <h2 className="text-xl font-black">交給 AI 的資料包</h2>
            <p className="text-sm text-[#6b839b]">至少一份；最多 10 份，單檔 12 MB，合計 40 MB。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FILE_GROUPS.map((group) => (
            <label
              key={group.name}
              className="group rounded-2xl border border-dashed border-[#174b80]/25 bg-[#f7faff] p-5 transition hover:border-[#1847d6] dark:border-white/20 dark:bg-[#09192b]"
            >
              <span className="flex items-center gap-2 font-black">
                <Paperclip className="size-4 text-[#1847d6]" />
                {group.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#6b839b]">{group.hint}</span>
              <input
                name={group.name}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp"
                className="mt-4 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#dfeaff] file:px-3 file:py-2 file:font-bold file:text-[#1847d6]"
              />
            </label>
          ))}
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-black">給課程設計者的補充說明</span>
          <textarea
            name="teacherNotes"
            rows={5}
            maxLength={6000}
            placeholder="哪些內容必須保留？哪些地方希望增加互動？有沒有不能改動的專有名詞？"
            className="mt-2 w-full rounded-2xl border border-[#174b80]/15 bg-[#f7faff] px-4 py-3 text-sm leading-6 outline-none focus:border-[#1847d6] focus:ring-2 focus:ring-[#1847d6]/15 dark:border-white/15 dark:bg-[#09192b]"
          />
        </label>
      </section>

      <section className="rounded-[2rem] border border-[#174b80]/10 bg-white/85 p-6 shadow-[0_24px_70px_rgba(7,26,53,.08)] sm:p-9 dark:border-white/10 dark:bg-white/[.055]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#f5b941] font-mono text-xs font-black text-[#071a35]">
            03
          </span>
          <div>
            <h2 className="text-xl font-black">聯絡與授權</h2>
            <p className="text-sm text-[#6b839b]">只用於本次投稿、審核和課堂製作聯絡。</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="教師姓名" name="teacherName" required />
          <Field label="電郵" name="email" type="email" required />
        </div>
        <label className="mt-6 flex items-start gap-3 rounded-2xl bg-[#eef4fb] p-4 text-sm leading-6 dark:bg-white/5">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            className="mt-1 size-4 accent-[#1847d6]"
          />
          <span>
            我確認有權提交這些資料，並同意万里 AI
            課堂為審核及製作本課而保存、分析和改編資料。只有人工審核批准後，資料才會傳送至托管
            OpenMAIC 生成課堂；未獲批准前不會向生成服務傳送、生成或公開課堂。
          </span>
        </label>
        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}
        <button
          disabled={submitting}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#071a35] px-6 py-3 text-sm font-black text-white disabled:opacity-50 dark:bg-[#71dce5] dark:text-[#071a35]"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {submitting ? '正在安全上載…' : '提交審核'}
        </button>
      </section>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = 'text',
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={200}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-[#174b80]/15 bg-[#f7faff] px-4 text-sm outline-none focus:border-[#1847d6] focus:ring-2 focus:ring-[#1847d6]/15 dark:border-white/15 dark:bg-[#09192b]"
      />
    </label>
  );
}
