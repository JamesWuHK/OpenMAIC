import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildStateContext } from '@/lib/orchestration/summarizers/state-context';
import type { StatelessChatRequest } from '@/lib/types/chat';
import type { Scene } from '@/lib/types/stage';

type StoreState = StatelessChatRequest['storeState'];
interface ClassroomFixture {
  id: string;
  stage: NonNullable<StoreState['stage']>;
  scenes: StoreState['scenes'];
}

// CI supplies the same reviewed fixtures mounted into the candidate image.
// Local focused runs may point at the release payload without copying courses.
const fixtureRoot = path.resolve(process.env.NOBEL_QA_CLASSROOMS_DIR || 'ci/nobel-acceptance/classrooms');
const fixtureCases = [
  ['hk-nobel-01-kagan-lecture-v5', 13],
  ['hk-nobel-02-soai-lecture-v5', 13],
  ['hk-nobel-03-halzen-lecture-v4', 12],
  ['hk-nobel-04-deisseroth-lecture-v3', 12],
  ['hk-nobel-05-hegemann-lecture-v2', 12],
  ['hk-nobel-06-nagel-lecture-v2', 12],
] as const;
const fixtures = fixtureCases.map(([id]) => JSON.parse(readFileSync(path.join(fixtureRoot, `${id}.json`), 'utf8')) as ClassroomFixture);

function stateFor(fixture: ClassroomFixture): StoreState {
  return { stage: fixture.stage, scenes: fixture.scenes, currentSceneId: null, mode: 'playback', whiteboardOpen: false };
}

function teachingNotes(context: string): string {
  const start = context.indexOf('Course teaching notes:');
  expect(start, 'Reviewed narration must have its own discussion context section').toBeGreaterThanOrEqual(0);
  const section = context.slice(start);
  const bodyStart = section.indexOf('\n') + 1;
  const bodyEnd = section.indexOf('\nTotal scenes:', bodyStart);
  expect(bodyEnd).toBeGreaterThanOrEqual(bodyStart);
  return section.slice(bodyStart, bodyEnd);
}

function syntheticScene(title: string, text: string, id = 'synthetic-scene'): Scene {
  return {
    ...fixtures[0].scenes[0],
    id,
    title,
    actions: [{ id: `${id}-speech`, type: 'speech', text }],
  };
}

function syntheticState(scenes: Scene[], id = fixtures[0].id): StoreState {
  return {
    ...stateFor(fixtures[0]),
    stage: { ...fixtures[0].stage, id, name: 'Synthetic context fixture', description: '' },
    scenes,
  };
}

describe('Nobel discussion context uses the reviewed lecture narration', () => {
  for (const [index, [id, sceneCount]] of fixtureCases.entries()) {
    it(`includes every complete authored speech from all ${sceneCount} scenes of ${id}`, () => {
      const fixture = fixtures[index];
      expect(fixture.id).toBe(id);
      expect(fixture.stage.id).toBe(id);
      expect(fixture.scenes).toHaveLength(sceneCount);
      const context = buildStateContext(stateFor(fixture));
      const notes = teachingNotes(context);
      let scenesWithSpeech = 0;
      for (const scene of fixture.scenes) {
        const speeches = (scene.actions ?? []).filter((action) => action.type === 'speech');
        expect(speeches.length, `${scene.id}: fixture must contain narration`).toBeGreaterThan(0);
        scenesWithSpeech++;
        expect(notes, `${scene.id}: include the page title in teaching notes, not only the scene list`).toContain(`${scene.title}\n`);
        for (const speech of speeches) {
          expect(speech.text.length, `${scene.id}: authored speech is nonempty`).toBeGreaterThan(0);
          expect(notes, `${scene.id}: do not omit or truncate the reviewed narration`).toContain(speech.text);
        }
      }
      expect(scenesWithSpeech).toBe(sceneCount);
      expect(notes.length).toBeLessThanOrEqual(24_000);
      expect(context).toContain('Preserve the attribution of each discovery to its scientist and collaborators.');
      expect(context).toContain('Distinguish research tools, possible applications, and proven products or treatments.');
      expect(context).toContain('If the notes do not support a claim, say that it is uncertain rather than inventing it.');
    });
  }

  it('preserves the complete Kagan/Soai attribution statements that prevent the observed mix-up', () => {
    const kagan = teachingNotes(buildStateContext(stateFor(fixtures[0])));
    const soai = teachingNotes(buildStateContext(stateFor(fixtures[1])));
    expect(kagan).toContain('卡甘發現，某啲反應入面，催化劑同產物嘅鏡像比例唔係簡單直線關係；硤合之後展示，產物亦可以參與催化，幫同類產物形成。');
    expect(soai).toContain('硤合同卡甘嘅研究各有重點：硤合展示反應產物點樣加入後續催化；卡甘就發現催化劑組成同產物偏向之間可以出現非線性關係。');
    expect(soai).toContain('硤合其中一項研究貢獻，係發現不對稱自催化：某啲反應形成嘅產物，自己亦可以參與催化同一個反應。');
  });
});

describe('Nobel teaching-notes injection stays within its intended scope', () => {
  it.each([
    'ordinary-lecture-v1',
    'hk-nobel-01-kagan',
    'hk-nobel-1-kagan-lecture-v5',
    'hk-nobel-01-kagan-lecture-vx',
    'unrelated-hk-nobel-01-kagan-lecture-v5',
  ])('does not inject narration for a nonmatching course id %s', (id) => {
    const state = syntheticState([syntheticScene('Normal page', 'NARRATION_MUST_NOT_LEAK_INTO_OTHER_COURSES')], id);
    const context = buildStateContext(state);
    expect(context).not.toContain('Course teaching notes:');
    expect(context).not.toContain('NARRATION_MUST_NOT_LEAK_INTO_OTHER_COURSES');
    expect(context).toContain('Total scenes: 1');
  });

  it('does not infer Nobel scope from a course title or description', () => {
    const state = syntheticState([syntheticScene('Nobel lesson', 'PRIVATE_NARRATION_SENTINEL')], 'normal-science');
    state.stage = { ...state.stage!, name: fixtures[0].stage.name, description: 'hk-nobel-01-kagan-lecture-v5' };
    expect(buildStateContext(state)).not.toContain('PRIVATE_NARRATION_SENTINEL');
  });

  it('handles a Nobel course with empty scenes or no nonempty speech safely', () => {
    const emptySpeech = syntheticScene('No speech', '');
    const noSpeech: Scene = { ...emptySpeech, actions: [] };
    // Legacy imported documents can omit actions; exercise that runtime seam
    // explicitly without weakening the application Scene type or using any.
    const { actions: _actions, ...withoutActions } = emptySpeech;
    const legacyNoActions = withoutActions as Scene;
    for (const scenes of [[], [emptySpeech], [noSpeech], [legacyNoActions]]) {
      expect(() => buildStateContext(syntheticState(scenes))).not.toThrow();
      expect(buildStateContext(syntheticState(scenes))).not.toContain('Course teaching notes:');
    }
  });

  it('does not inject notes without a stage', () => {
    expect(buildStateContext({ ...stateFor(fixtures[0]), stage: null })).not.toContain('Course teaching notes:');
  });
});

describe('Nobel teaching-notes size limit', () => {
  it.each([23_999, 24_000, 24_001])('keeps exactly the first min(%i, 24000) authored characters', (length) => {
    const title = 'Budget';
    const prefix = `${title}\n`;
    const narration = `${'x'.repeat(length - prefix.length - 4)}END!`;
    const fullNotes = `${prefix}${narration}`;
    const notes = teachingNotes(buildStateContext(syntheticState([syntheticScene(title, narration)])));
    expect(fullNotes).toHaveLength(length);
    expect(notes).toHaveLength(Math.min(length, 24_000));
    expect(notes).toBe(fullNotes.slice(0, 24_000));
    if (length <= 24_000) expect(notes.endsWith('END!')).toBe(true);
    else expect(notes.endsWith('END!')).toBe(false);
  });

  it('shares the 24000-character budget across scenes and retains the safety instructions outside it', () => {
    const first = syntheticScene('First', 'a'.repeat(23_980), 'first');
    const second = syntheticScene('Second', `b${'c'.repeat(1000)}OMITTED_FINAL_SENTINEL`, 'second');
    const fullNotes = `${first.title}\n${first.actions![0].type === 'speech' ? first.actions![0].text : ''}\n\n${second.title}\n${second.actions![0].type === 'speech' ? second.actions![0].text : ''}`;
    const context = buildStateContext(syntheticState([first, second]));
    const notes = teachingNotes(context);
    expect(notes).toHaveLength(24_000);
    expect(notes).toBe(fullNotes.slice(0, 24_000));
    expect(notes).toContain('\n\nSecond\nb');
    expect(context).not.toContain('OMITTED_FINAL_SENTINEL');
    expect(context).toContain('Preserve the attribution of each discovery to its scientist and collaborators.');
    expect(context).toContain('If the notes do not support a claim, say that it is uncertain rather than inventing it.');
    expect(context).toContain('Total scenes: 2');
  });
});
