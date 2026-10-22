import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const learnerRecoverySetting = 'recoverFromStorageError: isLearnerDeployment()';

describe('learner classroom storage recovery wiring', () => {
  it.each([
    'app/classroom/[id]/page.tsx',
    'components/classroom/ClassroomSurface.tsx',
  ])('enables learner-only recovery in %s', (sourcePath) => {
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).toContain(learnerRecoverySetting);
  });

  it('keeps later playback and stage persistence offline after recovery', () => {
    const playbackSource = readFileSync('components/edit/PlaybackChromeRoot.tsx', 'utf8');
    const stageStoreSource = readFileSync('lib/store/stage.ts', 'utf8');
    const voiceProfilesSource = readFileSync('lib/audio/voxcpm-voices.ts', 'utf8');

    expect(playbackSource).toContain('isBrowserStorageUnavailable()');
    expect(stageStoreSource).toContain('isBrowserStorageUnavailable()');
    expect(voiceProfilesSource).toContain('isBrowserStorageUnavailable()');
  });
});
