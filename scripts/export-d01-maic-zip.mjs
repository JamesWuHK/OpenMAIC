#!/usr/bin/env node

import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const input = path.resolve(process.argv[2] ?? 'output/d01-openmaic-candidates/D01-01-local-assembled.json');
const output = path.resolve(process.argv[3] ?? input.replace(/-local-assembled\.json$/u, '.maic.zip'));
const classroom = JSON.parse(await readFile(input, 'utf8'));
if (/\p{Script=Hangul}/u.test(JSON.stringify(classroom))) {
  throw new Error(`Refusing to export ${input}: course text contains Hangul/Korean characters`);
}
const agents = classroom.stage?.generatedAgentConfigs ?? classroom.agents ?? [];
const audioFiles = new Map();
const mediaIndex = {};

const manifestScenes = classroom.scenes.map((scene) => ({
  type: scene.type,
  title: scene.title,
  order: scene.order,
  content: scene.content,
  ...(scene.whiteboards ? { whiteboards: scene.whiteboards } : {}),
  ...(scene.multiAgent?.enabled
    ? {
        multiAgent: {
          enabled: true,
          agentIndices: (scene.multiAgent.agentIds ?? [])
            .map((id) => agents.findIndex((agent) => agent.id === id))
            .filter((index) => index >= 0),
          directorPrompt: scene.multiAgent.directorPrompt,
        },
      }
    : {}),
  ...(scene.actions
    ? {
        actions: scene.actions.map((action) => {
          if (action.type === 'speech' && (action.audioUrl || action.audioId)) {
            const mediaRef = action.audioUrl || action.audioId;
            const filename = path.basename(mediaRef.split(/[?#]/u)[0]);
            const archivePath = `audio/${String(audioFiles.size + 1).padStart(3, '0')}-${filename}`;
            audioFiles.set(archivePath, filename);
            mediaIndex[archivePath] = {
              type: 'audio',
              sourceRef: mediaRef,
              format: 'mp3',
              mimeType: 'audio/mpeg',
              voice: 'zh-HK-WanLungNeural, +20% (Edge TTS)',
            };
            const { audioId: _audioId, audioUrl: _audioUrl, ...rest } = action;
            return { ...rest, audioRef: archivePath };
          }
          if (action.type === 'discussion' && action.agentId) {
            const { agentId, ...rest } = action;
            const agentIndex = agents.findIndex((agent) => agent.id === agentId);
            return agentIndex >= 0 ? { ...rest, agentIndex } : rest;
          }
          const { audioId: _audioId, audioUrl: _audioUrl, ...rest } = action;
          return rest;
        }),
      }
    : {}),
}));

const manifest = {
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  appVersion: 'D01-local-candidate',
  stage: {
    name: classroom.stage.name,
    description: classroom.stage.description,
    language: classroom.stage.languageDirective,
    style: classroom.stage.style,
    videoManifest: classroom.stage.videoManifest,
    createdAt: classroom.stage.createdAt,
    updatedAt: classroom.stage.updatedAt,
  },
  agents: agents.map(({ name, role, persona, avatar, color, priority, voiceConfig, voiceDesign }) => ({
    name,
    role,
    persona,
    avatar,
    color,
    priority,
    ...(voiceConfig ? { voiceConfig } : {}),
    ...(voiceDesign ? { voiceDesign } : {}),
  })),
  scenes: manifestScenes,
  mediaIndex,
};

const staging = await mkdtemp(path.join(os.tmpdir(), 'd01-maic-zip-'));
try {
  await writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const sourceMedia = path.join(path.dirname(input), classroom.id, 'media');
  for (const [archivePath, filename] of audioFiles) {
    const target = path.join(staging, archivePath);
    await mkdir(path.dirname(target), { recursive: true });
    const source = path.join(sourceMedia, filename);
    await copyFile(source, target);
  }
  await execFileAsync('zip', ['-qr', output, '.'], { cwd: staging });
  console.log(JSON.stringify({
    classroomId: classroom.id,
    title: classroom.stage.name,
    scenes: manifestScenes.length,
    audioFiles: audioFiles.size,
    output,
  }, null, 2));
} finally {
  await rm(staging, { recursive: true, force: true });
}
