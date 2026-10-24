import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { HttpDocumentStore } from '@openmaic/storage/document/http';

import { validateAppScene, validateAppStage } from '@/lib/document-store/validators';
import { readPublishedClassroom } from '@/lib/learner/published-classroom';

const canonicalRoot = process.env.LEARNER_QA_CANONICAL_ROOT;
const frozenRoot = process.env.LEARNER_QA_FROZEN_RELEASE_ROOT;

describe.skipIf(!canonicalRoot || !frozenRoot)(
  'frozen live learner classroom compatibility',
  () => {
    it('loads every published lesson through the v1.2.1 HTTP document client', async () => {
      const catalogPath = path.join(frozenRoot!, 'content/learner/published-courses.json');
      const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as {
        courses: { id: string }[];
      };
      expect(catalog.courses.length).toBeGreaterThan(0);

      for (const { id } of catalog.courses) {
        const classroomsDir = path.join(
          id === 'hk-nobel-03-halzen-lecture-v3' ? frozenRoot! : canonicalRoot!,
          'data/classrooms',
        );
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
  },
);
