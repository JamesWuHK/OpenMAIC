import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const courseDir = join(
  process.cwd(),
  'docs/curriculum/courses/C01-persuasive-chinese-hong-kong',
);

const lessons = [
  '01-feeling-or-debatable-claim.md',
  '02-reason-evidence-explanation.md',
  '03-listen-before-reply.md',
  '04-same-view-different-audiences.md',
  '05-build-a-two-minute-route.md',
  '06-hong-kong-mini-proposal.md',
];

const requiredPatterns = [
  [/版本：v1\.2/u, 'v1.2 version marker'],
  [/本文檔單獨提交 OpenMAIC/u, 'standalone OpenMAIC marker'],
  [/場景節奏與判分要求/u, 'scene pacing and scoring section'],
  [/screenText/u, 'screenText output field'],
  [/speechCantonese/u, 'Cantonese output field'],
  [/speechMandarin/u, 'Mandarin output field'],
  [/zh-HK-WanLungNeural/u, 'male Cantonese voice'],
  [/zh-HK-Hiu(?:Gaai|Maan)Neural/u, 'female Cantonese voice'],
  [/\+20%/u, 'speech-rate baseline'],
  [/缺少指定語言時保持靜音/u, 'no cross-language fallback rule'],
  [/每個判分互動/u, 'interaction feedback contract'],
  [/不製作 TTS|不要製作 TTS/u, 'hosted generation TTS-off rule'],
  [/一手來源/u, 'first-party source section'],
  [/https:\/\//u, 'source URL'],
];

const failures = [];

for (const lesson of lessons) {
  const content = await readFile(join(courseDir, lesson), 'utf8');

  for (const [pattern, label] of requiredPatterns) {
    if (!pattern.test(content)) failures.push(`${lesson}: missing ${label}`);
  }

  if (!/(?:R[／/].*M[／/].*S|R\s*是.*M\s*是.*S\s*是|R-\d{2}.*M-\d{2}.*S-\d{2}|只使用\s+[RMS]-\d{2}|只有\s+`?S-\d{2})/su.test(content)) {
    failures.push(`${lesson}: missing an explicit evidence-type boundary`);
  }

  if (/普通話音色讀粵語稿|跨語種/u.test(content) === false) {
    failures.push(`${lesson}: missing explicit language mismatch prevention`);
  }
}

if (failures.length > 0) {
  console.error('C01 course document validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`C01 course document validation passed: ${lessons.length} standalone lessons`);
}
