import path from 'node:path';

import JSZip from 'jszip';

import {
  listSubmissions,
  readSubmissionFile,
  type TeacherSubmission,
  updateSubmissionGeneration,
} from './teacher-submissions';

const HOST = 'https://open.maic.chat';
const MAX_SOURCE_CHARS = 80_000;
const REQUEST_TIMEOUT_MS = 90_000;

type HealthCapabilities = {
  webSearch?: boolean;
  imageGeneration?: boolean;
  videoGeneration?: boolean;
  tts?: boolean;
};

type GenerationStatus = {
  status?: string;
  step?: string;
  progress?: number;
  error?: unknown;
  result?: { classroomId?: string; url?: string };
};

function accessCode(): string {
  return process.env.OPENMAIC_HOSTED_ACCESS_CODE?.trim() || '';
}

function authHeaders() {
  return { Authorization: `Bearer ${accessCode()}` };
}

function requestSignal(): AbortSignal {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

function stripXml(xml: string): string {
  return xml
    .replace(/<w:tab\/?\s*>/g, '\t')
    .replace(/<w:br\/?\s*>|<a:br\/?\s*>/g, '\n')
    .replace(/<\/w:p>|<\/a:p>|<\/row>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractOpenXml(bytes: Buffer, extension: string): Promise<string> {
  const archive = await JSZip.loadAsync(bytes);
  const patterns =
    extension === '.docx'
      ? [/^word\/document\.xml$/, /^word\/(?:header|footer)\d+\.xml$/]
      : extension === '.pptx'
        ? [/^ppt\/slides\/slide\d+\.xml$/]
        : [/^xl\/sharedStrings\.xml$/, /^xl\/worksheets\/sheet\d+\.xml$/];
  const names = Object.keys(archive.files).filter((name) => patterns.some((pattern) => pattern.test(name)));
  const parts = await Promise.all(names.sort().map((name) => archive.files[name].async('string')));
  return parts.map(stripXml).filter(Boolean).join('\n\n');
}

async function parseHostedPdf(file: { bytes: Buffer; name: string }): Promise<string> {
  const form = new FormData();
  form.set('pdf', new File([new Uint8Array(file.bytes)], file.name, { type: 'application/pdf' }));
  form.set('providerId', 'unpdf');
  const response = await fetch(`${HOST}/api/parse-pdf`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
    signal: requestSignal(),
  });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(`PDF extraction HTTP ${response.status}`);
  const candidate =
    (body.data as { data?: { text?: unknown }; text?: unknown } | undefined)?.data?.text ??
    (body.data as { text?: unknown } | undefined)?.text;
  return typeof candidate === 'string' ? candidate : '';
}

async function extractSubmissionSources(submission: TeacherSubmission): Promise<string> {
  const sections: string[] = [];
  for (const metadata of submission.files) {
    const stored = await readSubmissionFile(submission, metadata.id);
    if (!stored) continue;
    const extension = path.extname(metadata.originalName).toLowerCase();
    let extracted = '';
    if (['.txt', '.md', '.rtf'].includes(extension)) {
      extracted = stored.bytes.toString('utf8');
    } else if (['.docx', '.pptx', '.xlsx'].includes(extension)) {
      extracted = await extractOpenXml(stored.bytes, extension);
    } else if (extension === '.pdf') {
      extracted = await parseHostedPdf({ bytes: stored.bytes, name: metadata.originalName });
    }
    sections.push(
      [`## ${metadata.category}: ${metadata.originalName}`, extracted || '[此檔案未能抽取文字；只可按檔名及教師說明理解。]'].join('\n'),
    );
  }
  return sections.join('\n\n---\n\n').slice(0, MAX_SOURCE_CHARS);
}

export async function buildTeacherGenerationRequirement(submission: TeacherSubmission) {
  const sourceText = await extractSubmissionSources(submission);
  return `你要為香港學生製作一節可互動的 OpenMAIC 課堂。所有學生可見文字必須使用香港繁體中文；粵語口述文案與普通話文案必須分開撰寫，不可用普通話句式冒充粵語。這是一份教師投稿，以下資料已通過人工審核，但仍要辨別事實、模擬與原創情境，不可虛構香港數據或把課堂模擬當成真實證據。不要加入真實危險操作指引。

課程名稱：${submission.courseTitle}
學科／主題：${submission.subject}
適合年級：${submission.gradeBand}
授課語言：${submission.teachingLanguage}
預計課時：${submission.lessonDuration || '未指定'}
核心學習目標：
${submission.learningGoals}

教師補充說明：
${submission.teacherNotes || '沒有'}

請把教師資料重組為有清晰開場、概念建構、有效互動、形成性評估與總結的一節課。互動、Quiz、角色討論或 PBL 只在服務學習目標時使用；不可在畫面顯示 OpenMAIC、GitHub、模型選擇或作者工具。

以下是教師提交資料的文字抽取內容：

${sourceText}`;
}

async function healthCapabilities(): Promise<HealthCapabilities> {
  const response = await fetch(`${HOST}/api/health`, {
    headers: authHeaders(),
    signal: requestSignal(),
  });
  if (!response.ok) throw new Error(`OpenMAIC health HTTP ${response.status}`);
  const body = (await response.json()) as { capabilities?: HealthCapabilities };
  return body.capabilities || {};
}

async function submitOne(submission: TeacherSubmission, capabilities: HealthCapabilities) {
  const claimed = await updateSubmissionGeneration(submission, {
    status: 'submitting_generation',
    generationStartedAt: new Date().toISOString(),
    generationStep: 'preparing_sources',
    generationError: undefined,
  });
  try {
    const requirement = await buildTeacherGenerationRequirement(claimed);
    const request: Record<string, unknown> = { requirement, language: 'zh-CN', agentMode: 'generate' };
    if (capabilities.webSearch) request.enableWebSearch = true;
    if (capabilities.imageGeneration) request.enableImageGeneration = true;
    if (capabilities.videoGeneration) request.enableVideoGeneration = false;
    if (capabilities.tts) request.enableTTS = false;
    const response = await fetch(`${HOST}/api/generate-classroom`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: requestSignal(),
    });
    const body = (await response.json()) as { jobId?: string; status?: string; step?: string; error?: unknown };
    if (!response.ok || !body.jobId) {
      throw new Error(`OpenMAIC submit HTTP ${response.status}: ${JSON.stringify(body.error || body)}`);
    }
    await updateSubmissionGeneration(claimed, {
      status: 'generating',
      generationJobId: body.jobId,
      generationPollUrl: `${HOST}/api/generate-classroom/${encodeURIComponent(body.jobId)}`,
      generationStep: body.step || body.status || 'queued',
      generationProgress: 0,
    });
  } catch (error) {
    await updateSubmissionGeneration(claimed, {
      status: 'generation_failed',
      generationError: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown generation error',
      generationStep: 'submission_failed',
    });
  }
}

async function pollOne(submission: TeacherSubmission) {
  if (!submission.generationJobId) return;
  const pollUrl = `${HOST}/api/generate-classroom/${encodeURIComponent(submission.generationJobId)}`;
  try {
    const response = await fetch(pollUrl, { headers: authHeaders(), signal: requestSignal() });
    const body = (await response.json()) as GenerationStatus;
    if (!response.ok) throw new Error(`OpenMAIC poll HTTP ${response.status}`);
    if (body.status === 'succeeded' && body.result?.classroomId) {
      await updateSubmissionGeneration(submission, {
        status: 'generated',
        generatedAt: new Date().toISOString(),
        generationProgress: 100,
        generationStep: body.step || 'completed',
        hostedClassroomId: body.result.classroomId,
        generatedClassroomUrl: `${HOST}/classroom/${encodeURIComponent(body.result.classroomId)}`,
      });
      return;
    }
    if (body.status === 'failed') {
      await updateSubmissionGeneration(submission, {
        status: 'generation_failed',
        generationStep: body.step || 'failed',
        generationError: JSON.stringify(body.error || 'OpenMAIC generation failed').slice(0, 1000),
      });
      return;
    }
    await updateSubmissionGeneration(submission, {
      generationProgress: typeof body.progress === 'number' ? body.progress : submission.generationProgress,
      generationStep: body.step || body.status || submission.generationStep,
    });
  } catch (error) {
    console.warn('[teacher-generation] transient poll failure', submission.id, error);
  }
}

let activeCycle: Promise<void> | null = null;

export async function runTeacherGenerationCycle(): Promise<void> {
  if (!accessCode()) return;
  const rows = await listSubmissions();
  await Promise.all(rows.filter((row) => row.status === 'generating').map(pollOne));
  const queued = rows.find((row) => row.status === 'queued_for_generation');
  if (queued) await submitOne(queued, await healthCapabilities());
}

export function startTeacherGenerationSchedule() {
  if (process.env.OPENMAIC_TEACHER_GENERATION_ENABLED !== 'true' || !accessCode()) return null;
  const tick = () => {
    if (!activeCycle) {
      activeCycle = runTeacherGenerationCycle()
        .catch((error) => console.error('[teacher-generation] cycle failed', error))
        .finally(() => {
          activeCycle = null;
        });
    }
  };
  const initial = setTimeout(tick, 5_000);
  const interval = setInterval(tick, 60_000);
  initial.unref();
  interval.unref();
  return {
    async stop() {
      clearTimeout(initial);
      clearInterval(interval);
      await activeCycle;
    },
  };
}
