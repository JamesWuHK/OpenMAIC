import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { migrate } from '@openmaic/dsl';

import { validateAppScene, validateAppStage } from '@/lib/document-store/validators';
import { CLASSROOMS_DIR, isValidClassroomId } from '@/lib/server/classroom-storage';
import type { Scene, Stage } from '@/lib/types/stage';

import { isAllowlistedLearnerCourseId } from './filesystem-public-courses';

/** Read only a classroom named by the public learner catalog, not an adjacent draft. */
export async function readPublishedClassroom(
  stageId: string,
  classroomsDir = CLASSROOMS_DIR,
  catalogPath?: string,
): Promise<{
  stage: Stage;
  scenes: Scene[];
  dslVersion: string;
  outline: {
    outlines: [];
    generationComplete: true;
    createdAt: number;
    updatedAt: number;
  };
  sourceSha256: string;
} | null> {
  if (!isValidClassroomId(stageId)) return null;
  if (!(await isAllowlistedLearnerCourseId(stageId, catalogPath))) return null;

  let classroom: unknown;
  let sourceSha256: string;
  try {
    const source = await readFile(path.join(classroomsDir, `${stageId}.json`));
    sourceSha256 = createHash('sha256').update(source).digest('hex');
    classroom = JSON.parse(source.toString('utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (!classroom || typeof classroom !== 'object') return null;
  const document = classroom as {
    id?: unknown;
    stage?: Record<string, unknown>;
    scenes?: unknown;
  };
  if (
    document.id !== stageId ||
    document.stage?.id !== stageId ||
    !Array.isArray(document.scenes)
  ) {
    return null;
  }
  // Match the upstream legacy classroom importer: old generator snapshots can
  // carry a different scene.stageId even though the published file name and
  // stage.id are authoritative. Normalize that structural link on read only.
  const scenes = document.scenes.map((scene) =>
    scene && typeof scene === 'object' ? { ...scene, stageId } : scene,
  );
  const migrated = migrate({ stage: document.stage, scenes }) as {
    stage: Stage;
    scenes: Scene[];
    dslVersion: string;
  };
  const problems: string[] = [];
  const stageValidation = validateAppStage(migrated.stage);
  if (!stageValidation.valid) problems.push(`stage: ${JSON.stringify(stageValidation.errors)}`);
  const sceneIds = new Set<string>();
  for (const scene of migrated.scenes) {
    if (scene.stageId !== stageId || sceneIds.has(scene.id)) {
      problems.push(`scene ${scene.id}: duplicate or mismatched stage ID`);
    }
    sceneIds.add(scene.id);
    const validation = validateAppScene(scene);
    if (!validation.valid) problems.push(`scene ${scene.id}: ${JSON.stringify(validation.errors)}`);
  }
  if (problems.length) {
    throw new Error(`Published learner classroom ${stageId} is invalid: ${problems.join('; ')}`);
  }
  // File content remains authoritative even after a same-ID update. Mark it
  // complete so the browser never attempts to auto-save this public document
  // into PostgreSQL while opening a read-only lesson.
  const createdAt = Number.isFinite(migrated.stage.createdAt)
    ? migrated.stage.createdAt
    : Date.now();
  const updatedAt = Number.isFinite(migrated.stage.updatedAt)
    ? migrated.stage.updatedAt
    : createdAt;
  return {
    ...migrated,
    outline: { outlines: [], generationComplete: true, createdAt, updatedAt },
    sourceSha256,
  };
}
