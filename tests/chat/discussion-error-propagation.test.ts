import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV3 } from 'ai/test';
import { runAgentLoop } from '@/lib/chat/agent-loop';
import { statelessGenerate } from '@/lib/orchestration/stateless-generate';
import type { StatelessChatRequest, StatelessEvent } from '@/lib/types/chat';

afterEach(() => vi.unstubAllEnvs());
const storeState = { stage: null, scenes: [], currentSceneId: null, mode: 'playback' as const, whiteboardOpen: false };
const agentIds = ['test-teacher', 'test-peer'];
const request: StatelessChatRequest = {
  apiKey: '', storeState,
  messages: [{ id: 'test-message', role: 'user', parts: [{ type: 'text', text: 'What evidence is still missing?' }] }],
  config: { sessionType: 'discussion', agentIds, agentConfigs: agentIds.map((id, i) => ({ id, name: id, role: i === 0 ? 'teacher' : 'student', persona: 'Ask for evidence.', avatar: '', color: '#123456', allowedActions: [], priority: i + 1 })) },
};

describe('discussion failures are not normal completion', () => {
  it('surfaces director provider failures as error events, never a zero-agent done', async () => {
    vi.stubEnv('OPENMAIC_DEPLOYMENT_MODE', 'learner');
    const model = new MockLanguageModelV3({ doGenerate: async () => { throw new Error('SYNTHETIC_PROVIDER_ACCOUNT_ERROR'); } });
    const events: StatelessEvent[] = [];
    for await (const event of statelessGenerate(request, new AbortController().signal, model)) events.push(event);
    expect(events.some(event => event.type === 'error')).toBe(true);
    expect(events.some(event => event.type === 'done')).toBe(false);
    expect(JSON.stringify(events)).not.toContain('SYNTHETIC_PROVIDER_ACCOUNT_ERROR');
  });

  it('does not swallow a stream consumer error inside the JSON parsing catch', async () => {
    const failure = new Error('consumer failed');
    await expect(runAgentLoop({ apiKey: '', config: { agentIds } }, {
      getStoreState: () => storeState, getMessages: () => [],
      fetchChat: async () => new Response('data: {"type":"thinking","data":{"stage":"director"}}\n\n'),
      onEvent: () => { throw failure; },
      onIterationEnd: async () => ({ totalAgents: 0, agentHadContent: false, cueUserReceived: false }),
    }, new AbortController().signal)).rejects.toBe(failure);
  });

  it('rejects explicit SSE errors even if the consumer does not throw and a done follows', async () => {
    await expect(runAgentLoop({ apiKey: '', config: { agentIds } }, {
      getStoreState: () => storeState, getMessages: () => [],
      fetchChat: async () => new Response('data: {"type":"error","data":{"message":"Service unavailable"}}\n\ndata: {"type":"done","data":{"totalAgents":0}}\n\n'),
      onEvent: () => {},
      onIterationEnd: async () => ({ totalAgents: 0, agentHadContent: false, cueUserReceived: false }),
    }, new AbortController().signal)).rejects.toThrow('Service unavailable');
  });

  it('still ignores malformed JSON and accepts a genuine normal end', async () => {
    const result = await runAgentLoop({ apiKey: '', config: { agentIds } }, {
      getStoreState: () => storeState, getMessages: () => [],
      fetchChat: async () => new Response('data: invalid-json\n\ndata: {"type":"done","data":{"totalAgents":0}}\n\n'),
      onEvent: () => {},
      onIterationEnd: async () => ({ totalAgents: 0, agentHadContent: false, cueUserReceived: false }),
    }, new AbortController().signal);
    expect(result.reason).toBe('end');
  });
});
