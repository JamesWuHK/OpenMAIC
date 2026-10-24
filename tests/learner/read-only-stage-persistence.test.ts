import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveIncremental, saveFull } = vi.hoisted(() => ({
  saveIncremental: vi.fn().mockResolvedValue(undefined),
  saveFull: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/config/deployment-mode', () => ({
  isLearnerDeployment: () => true,
}));

vi.mock('@/lib/utils/stage-storage', () => ({
  saveStageDataIncremental: saveIncremental,
  saveStageData: saveFull,
  loadStageData: vi.fn().mockResolvedValue(null),
}));

import { flushStageSave, useStageStore } from '@/lib/store/stage';
import { loadModelCapabilities } from '@/lib/model-settings/capabilities';
import type { ModelSettingsClient } from '@/lib/model-settings/client';

beforeEach(() => {
  saveIncremental.mockClear();
  saveFull.mockClear();
  useStageStore.getState().clearStore();
});

describe('published learner document persistence', () => {
  it('never queues a course-document write during classroom playback', async () => {
    useStageStore.getState().setStage({
      id: 'published-lesson',
      name: 'Published lesson',
      createdAt: 1,
      updatedAt: 1,
    });
    useStageStore.getState().setCurrentSceneId('scene-1');
    useStageStore.getState().setChats([]);
    await flushStageSave();
    const saved = await useStageStore.getState().saveToStorage();

    expect(saved).toBe(false);
    expect(saveIncremental).not.toHaveBeenCalled();
    expect(saveFull).not.toHaveBeenCalled();
  });

  it('does not query the authoring model-settings endpoint for a discussion', async () => {
    const load = vi.fn();
    const getState = vi.fn();
    const capabilities = await loadModelCapabilities({
      load,
      getState,
    } as unknown as ModelSettingsClient);

    expect(capabilities.known).toBe(false);
    expect(load).not.toHaveBeenCalled();
    expect(getState).not.toHaveBeenCalled();
  });
});
