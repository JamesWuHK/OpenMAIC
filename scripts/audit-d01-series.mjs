#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audit = path.join(root, 'scripts/audit-d01-local.mjs');
const candidates = path.resolve(process.argv[2] ?? path.join(root, 'output/d01-openmaic-candidates'));

for (const lesson of ['01', '02', '03', '04', '05', '06']) {
  const classroom = path.join(candidates, `D01-${lesson}-local-assembled.json`);
  const result = spawnSync(process.execPath, [audit, classroom], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`D01_SERIES_AUDIT_PASS: all six lessons in ${candidates} passed DSL, content, media, PBL-sequence and durable-bridge structure gates.`);
