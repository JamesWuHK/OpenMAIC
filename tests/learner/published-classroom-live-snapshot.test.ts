import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { HttpDocumentStore } from '@openmaic/storage/document/http';

import { validateAppScene, validateAppStage } from '@/lib/document-store/validators';
import { readPublishedClassroom } from '@/lib/learner/published-classroom';

const releaseRoot = process.env.LEARNER_QA_RELEASE_ROOT;

describe.skipIf(!releaseRoot)('current full learner release compatibility', () => {
  it('loads every published lesson through the v1.2.1 HTTP document client', async () => {
    const catalogPath = path.join(releaseRoot!, 'content/learner/published-courses.json');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as {
      courses: { id: string }[];
    };
    expect(catalog.courses.length).toBeGreaterThan(0);

    for (const { id } of catalog.courses) {
      const classroomsDir = path.join(releaseRoot!, 'data/classrooms');
      const raw = await readPublishedClassroom(id, classroomsDir, catalogPath);
      expect(raw, id).not.toBeNull();
      const store = new HttpDocumentStore({
        baseUrl: 'https://learner.example/api/persistence',
        validateStage: validateAppStage,
        validateScene: validateAppScene,
        fetch: async () => Response.json(raw),
      });
      const document = await store.loadDocument(id);
      expect(document?.stage.id, id).toBe(id);
      expect(document?.scenes.length, id).toBe(raw!.scenes.length);
      expect(validateAppStage(document!.stage).valid, id).toBe(true);
      for (const scene of document!.scenes) {
        expect(validateAppScene(scene).valid, `${id}/${scene.id}`).toBe(true);
      }
    }
  });
});
