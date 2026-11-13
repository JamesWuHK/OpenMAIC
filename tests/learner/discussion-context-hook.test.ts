// @vitest-environment jsdom
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useChatSessions, normalizeStoredSessionsForRestore, resolveDiscussionReplyAgent } from '@/components/chat/use-chat-sessions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const mocks = vi.hoisted(() => {
  const stage: any = { stage: { id: 'context-stage' }, scenes: [], outlines: [], currentSceneId: 'context-scene', mode: 'playback', chats: [] };
  stage.setChats = (chats: unknown[]) => { stage.chats = chats; };
  return { stage, settings: { selectedAgentIds: ['default-1'] }, bodies: [] as any[], error: vi.fn() };
});
vi.mock('@/lib/store', () => ({ useStageStore: Object.assign((select: (s: any) => unknown) => select(mocks.stage), { getState: () => mocks.stage }) }));
vi.mock('@/lib/store/settings', () => ({ useSettingsStore: Object.assign((select: (s: any) => unknown) => select(mocks.settings), { getState: () => mocks.settings }) }));
vi.mock('@/lib/config/deployment-mode', () => ({ isLearnerDeployment: () => true }));
vi.mock('@/lib/config/feature-flags', async importOriginal => ({ ...await importOriginal<object>(), isPiChatEnabled: () => false }));
vi.mock('@/lib/hooks/use-i18n', () => ({ useI18n: () => ({ locale: 'zh-TW', t: (key: string) => key }) }));
vi.mock('@/lib/chat/client-model-policy', () => ({ clientModelConfigurationError: () => null, toChatModelRequestFields: () => ({ apiKey: '' }) }));
vi.mock('@/lib/utils/model-config', () => ({ getCurrentModelConfig: () => ({}) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, warning: vi.fn(), dismiss: vi.fn() } }));

let api: ReturnType<typeof useChatSessions>, root: Root, host: HTMLDivElement;
function Harness() { api = useChatSessions(); return null; }
beforeEach(async () => {
  mocks.stage.chats = []; mocks.bodies.length = 0; mocks.error.mockClear();
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    mocks.bodies.push(JSON.parse(String(init.body)));
    const events = [{ type: 'cue_user', data: { fromAgentId: 'default-1' } }, { type: 'done', data: { totalAgents: 0, totalActions: 0, cueUserReceived: true } }];
    return new Response(events.map(e => 'data: ' + JSON.stringify(e) + '\n\n').join(''), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(createElement(Harness)));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const start = (topic: string, prompt: string) => act(async () => { await api.startDiscussion({ agentId: 'default-1', topic, prompt }); });

describe('discussion context lifecycle in the real hook', () => {
  it('dispatches the teacher for every new discussion follow-up', async () => {
    await start('topic', 'prompt');
    await act(async () => { await api.sendMessage('first question'); });
    await act(async () => { await api.sendMessage('second question'); });
    expect(mocks.bodies).toHaveLength(3);
    for (const body of mocks.bodies.slice(1)) {
      expect(body.config).toMatchObject({ sessionType: 'discussion', triggerAgentId: 'default-1', discussionTopic: 'topic', discussionPrompt: 'prompt' });
    }
    expect(mocks.error).not.toHaveBeenCalled();
  }, 15000);

  it('keeps the authored topic and prompt after soft pause and resume', async () => {
    await start('topic A', 'prompt A');
    await act(async () => { await api.softPauseActiveSession(); });
    await act(async () => { await api.resumeActiveSession(); });
    expect(mocks.bodies).toHaveLength(2);
    expect(mocks.bodies[1].config).toMatchObject({ sessionType: 'discussion', discussionTopic: 'topic A', discussionPrompt: 'prompt A' });
    expect(mocks.error).not.toHaveBeenCalled();
  }, 15000);
  it('does not inherit an ended discussion into a new ordinary Q&A session', async () => {
    await start('private topic A', 'private prompt A');
    await act(async () => { await api.endActiveSession(); });
    await act(async () => { await api.sendMessage('ordinary question'); });
    const config = mocks.bodies.at(-1).config;
    expect(config.sessionType).toBe('qa');
    expect(config).not.toHaveProperty('triggerAgentId');
    expect(config).not.toHaveProperty('discussionTopic'); expect(config).not.toHaveProperty('discussionPrompt');
    expect(mocks.error).not.toHaveBeenCalled();
  }, 15000);
  it('uses the second discussion context and retains it in saved session data', async () => {
    await start('topic A', 'prompt A');
    await start('topic B', 'prompt B');
    await act(async () => { await api.sendMessage('question B'); });
    expect(mocks.bodies.at(-1).config).toMatchObject({ sessionType: 'discussion', discussionTopic: 'topic B', discussionPrompt: 'prompt B' });
    expect(mocks.bodies.at(-1).config.discussionPrompt).not.toBe('prompt A');
    const saved = JSON.parse(JSON.stringify(mocks.stage.chats));
    const restored = normalizeStoredSessionsForRestore(saved);
    expect(restored.find(s => s.title === 'topic B')?.config).toMatchObject({ discussionTopic: 'topic B', discussionPrompt: 'prompt B' });
    expect(mocks.error).not.toHaveBeenCalled();
  }, 15000);
});


describe('discussion responder selection', () => {
  const agents: Record<string, { role: string; priority: number }> = {
    pupil: { role: 'student', priority: 99 },
    helper: { role: 'assistant', priority: 90 },
    tutor: { role: 'teacher', priority: 5 },
    lead: { role: 'teacher', priority: 10 },
    peerLead: { role: 'teacher', priority: 10 },
  };
  const getAgent = (id: string) => agents[id];
  it('chooses the highest-priority selected teacher instead of the opening assistant', () => {
    expect(resolveDiscussionReplyAgent(['helper', 'tutor', 'lead', 'pupil'], getAgent, 'helper')).toBe('lead');
  });
  it('keeps selected order when teacher priorities tie', () => {
    expect(resolveDiscussionReplyAgent(['peerLead', 'lead'], getAgent)).toBe('peerLead');
  });
  it('does not reintroduce an unselected teacher', () => {
    expect(resolveDiscussionReplyAgent(['pupil', 'helper'], getAgent, 'lead')).toBe('pupil');
  });
  it('retains a valid selected opening agent when no teacher is selected', () => {
    expect(resolveDiscussionReplyAgent(['pupil', 'helper'], getAgent, 'helper')).toBe('helper');
  });
  it('skips registry-missing IDs for the fallback', () => {
    expect(resolveDiscussionReplyAgent(['missing', 'helper'], getAgent, 'missing')).toBe('helper');
  });
  it('does not invent an agent for an empty or unavailable selection', () => {
    expect(resolveDiscussionReplyAgent([], getAgent, 'lead')).toBeUndefined();
    expect(resolveDiscussionReplyAgent(['missing'], getAgent, 'missing')).toBeUndefined();
  });
});
