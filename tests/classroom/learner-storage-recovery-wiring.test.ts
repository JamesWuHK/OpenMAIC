import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('learner classroom server-storage wiring', () => {
  it('routes the classroom page through the shared server-first surface', () => {
    const page = readFileSync('app/classroom/[id]/page.tsx', 'utf8');
    const surface = readFileSync('components/classroom/ClassroomSurface.tsx', 'utf8');

    expect(page).toContain('<ClassroomSurface classroomId={params.id} variant="page" />');
    expect(surface).toContain('resolveClassroomDeploymentPolicy(isLearnerDeployment())');
    expect(surface).toContain('classroomPolicy.forceReadOnly');
    expect(surface).not.toContain('recoverFromStorageError');
  });

  it('keeps browser-storage-unavailable guards for playback preferences', () => {
    const playbackSource = readFileSync('components/edit/PlaybackChromeRoot.tsx', 'utf8');
    const stageStoreSource = readFileSync('lib/store/stage.ts', 'utf8');
    const voiceProfilesSource = readFileSync('lib/audio/voxcpm-voices.ts', 'utf8');

    expect(playbackSource).toContain('isBrowserStorageUnavailable()');
    expect(stageStoreSource).toContain('isBrowserStorageUnavailable()');
    expect(voiceProfilesSource).toContain('isBrowserStorageUnavailable()');
  });
});
