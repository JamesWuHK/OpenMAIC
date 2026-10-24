import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LanguageModel } from 'ai';

import { AISdkLangGraphAdapter } from '@/lib/orchestration/ai-sdk-adapter';
import { buildStructuredPrompt } from '@/lib/orchestration/prompt-builder';
import type { AgentConfig } from '@/lib/orchestration/registry/types';
import { getConversationActions } from '@/lib/orchestration/tool-schemas';
import {
  createParserState, finalizeParser, looksLikeStructuredFragment, parseStructuredChunk,
  statelessGenerate, type ParseResult,
} from '@/lib/orchestration/stateless-generate';
import type { StatelessChatRequest, StatelessEvent } from '@/lib/types/chat';

const nobelId = 'hk-nobel-01-kagan-lecture-v5';
const allowed = ['spotlight', 'laser', 'play_video', 'wb_open', 'wb_close', 'wb_draw_text', 'wb_draw_shape', 'wb_draw_chart', 'wb_draw_latex', 'wb_draw_table', 'wb_draw_line', 'wb_draw_code', 'wb_edit_code', 'wb_clear', 'wb_delete'];
const nonSlideAllowed = ['play_video', 'wb_open', 'wb_close', 'wb_draw_text', 'wb_draw_shape', 'wb_draw_chart', 'wb_draw_latex', 'wb_draw_table', 'wb_draw_line', 'wb_draw_code', 'wb_edit_code', 'wb_clear', 'wb_delete'];
const agent: AgentConfig = {
  id: 'protocol-teacher', name: 'Test teacher', role: 'teacher', persona: 'Explain briefly.',
  avatar: '', color: '#123456', allowedActions: [...allowed], priority: 10,
  createdAt: new Date(0), updatedAt: new Date(0), isDefault: false,
};

function storeState(stageId = nobelId): StatelessChatRequest['storeState'] {
  return {
    stage: { id: stageId, name: 'Protocol fixture', createdAt: 0, updatedAt: 0 },
    scenes: [{ id: 'page-1', stageId, title: 'Lecture page', type: 'interactive', order: 0,
      content: { type: 'interactive', url: '', html: '<h1>Lecture page</h1>' }, actions: [], createdAt: 0, updatedAt: 0 }],
    currentSceneId: 'page-1', mode: 'playback', whiteboardOpen: false,
  };
}

function promptFor(stageId: string, userText: string) {
  const actions = getConversationActions(agent.allowedActions, 'interactive', stageId, userText);
  return buildStructuredPrompt(agent, storeState(stageId), undefined, undefined, undefined, undefined, actions);
}

afterEach(() => vi.restoreAllMocks());

describe('conversation action policy keeps ordinary courses intact', () => {
  it.each([
    [undefined, allowed], ['slide', allowed], ['interactive', nonSlideAllowed], ['quiz', nonSlideAllowed],
  ] as const)('preserves the exact existing allowed action order for ordinary %s scenes', (sceneType, expected) => {
    for (const text of ['', '請用生活類比解釋。', 'Please draw a diagram.', '不用白板，請口頭說明。']) {
      const original = [...allowed];
      expect(getConversationActions(original, sceneType, 'ordinary-course', text)).toEqual(expected);
      expect(original).toEqual(allowed);
    }
  });

  it('does not grant actions to an agent whose allowed list is empty', () => {
    expect(getConversationActions([], 'interactive', nobelId, '請畫一張圖。')).toEqual([]);
    expect(getConversationActions([], 'slide', 'ordinary-course', 'draw')).toEqual([]);
  });
});

describe('ordinary Nobel explanations are text only; drawing is an explicit opt in', () => {
  it.each([
    '請解釋卡甘的貢獻和限制。',
    '可以用日常生活例子作一個類比嗎？',
    'Please explain this with an analogy.',
    'What is the value of this discovery?',
    '不要畫圖，只用文字解釋。',
    '唔好開白板，請口頭講清楚。',
    '不用白板，請用口頭類比。',
    '畫面中的線代表甚麼？',
    '請解釋畫面上的圖示。',
    '',
  ])('does not replace a lecture explanation with a whiteboard: %s', (text) => {
    expect(getConversationActions(allowed, 'interactive', nobelId, text)).toEqual([]);
    expect(getConversationActions(allowed, 'slide', nobelId, text)).toEqual([]);
  });

  it.each(['請在白板畫出來。', '請畫一張簡圖。', '请画图说明。', '請繪圖。', '畫圖', '畫一個圖解', '绘制一张图', 'Please draw a diagram.', 'A drawing, please.', 'Please sketch this.', 'Use the whiteboard.'])('retains the agent’s existing scene-appropriate actions: %s', (text) => {
    expect(getConversationActions(allowed, 'interactive', nobelId, text)).toEqual(nonSlideAllowed);
    expect(getConversationActions(allowed, 'slide', nobelId, text)).toEqual(allowed);
  });

  it('does not match a non-Nobel id merely because it contains Nobel words', () => {
    expect(getConversationActions(allowed, 'interactive', 'ordinary-hk-nobel-01-kagan-lecture-v5', 'Explain.')).toEqual(nonSlideAllowed);
  });
});

describe('Nobel system prompt constraints agree with the effective action policy', () => {
  it('requires natural short traditional-Chinese speech and JSON protocol while keeping the lecture visible', () => {
    const prompt = promptFor(nobelId, '用生活例子解釋。');
    expect(prompt).toContain('# Ordinary Nobel lecture conversation');
    expect(prompt).toContain('brief, natural Hong Kong traditional Chinese speech');
    expect(prompt).toContain('preserve scientist attribution and application limits');
    expect(prompt).toContain('An analogy request is a request for an explanation, not permission to replace the lesson with a whiteboard.');
    expect(prompt).toContain('No drawing actions are available this turn. Reply using text objects only; keep the lecture visible.');
    expect(prompt).toContain('Return exactly a JSON array of text/action objects');
    expect(prompt).toContain('Never output native tool_call, arg_key or arg_value markup');
    expect(prompt).toContain('Always give a meaningful spoken explanation; tools alone are not an answer.');
    expect(prompt).toContain('You have no actions available. You can only speak to students.');
    expect(prompt).not.toMatch(/"name"\s*:\s*"wb_open"/);
    expect(prompt).not.toContain('# Whiteboard — Teacher Role');
    expect(prompt).not.toContain('WHITEBOARD CLOSE RULE');
  });

  it('permits explicitly requested drawing while still requiring a spoken answer', () => {
    const prompt = promptFor(nobelId, '請畫圖。');
    expect(prompt).toContain('The learner requested drawing: available actions may support your spoken explanation.');
    expect(prompt).not.toContain('No drawing actions are available this turn.');
    expect(prompt).toContain('Always give a meaningful spoken explanation; tools alone are not an answer.');
    expect(prompt).toMatch(/"name"\s*:\s*"wb_open"/);
    expect(prompt).toContain('# Whiteboard — Teacher Role');
  });

  it('does not append Nobel policy to ordinary-course prompts', () => {
    const prompt = promptFor('ordinary-course', '用類比解釋。');
    expect(prompt).not.toContain('# Ordinary Nobel lecture conversation');
    expect(prompt).not.toContain('No drawing actions are available this turn.');
    expect(prompt).not.toContain('brief, natural Hong Kong traditional Chinese speech');
    expect(prompt).toMatch(/"name"\s*:\s*"wb_open"/);
    expect(prompt).toContain('# Whiteboard — Teacher Role');
  });
});

function parseStream(text: string, chunkSize = text.length) {
  const state = createParserState();
  const results: ParseResult[] = [];
  for (let offset = 0; offset < text.length; offset += chunkSize) results.push(parseStructuredChunk(text.slice(offset, offset + chunkSize), state));
  results.push(finalizeParser(state));
  return { text: results.flatMap((result) => result.textChunks).join(''), actions: results.flatMap((result) => result.actions), results };
}

describe('native tool protocol is never a raw-prose answer', () => {
  it('suppresses the exact raw02 teacher-bubble XML from the real candidate regression', () => {
    const raw02 = '<tool_call>wb_open</tool_call><tool_call>wb_draw_shape<arg_key>shape</arg_key><arg_value>circle</arg_value><arg_key>x</arg_key><arg_value>120</arg_value><arg_key>y</arg_key><arg_value>120</arg_value><arg_key>width</arg_key><arg_value>80</arg_value><arg_key>height</arg_key><arg_value>80</arg_value><arg_key>fillColor</arg_key><arg_value>#5b9bd5</arg_value></tool_call>';
    for (const raw of [raw02, `${raw02}。`]) for (const size of [1, 7, 23, raw.length]) {
      const parsed = parseStream(raw, size);
      expect(parsed.text).toBe('');
      expect(parsed.actions).toEqual([]);
    }
  });

  it.each([
    '<tool_call>wb_open</tool_call>',
    '<tool_call name="wb_open"><arg_key>content</arg_key><arg_value>白板</arg_value></tool_call>',
    '<arg_key>content</arg_key><arg_value>內部控制資料</arg_value>',
    '<function_call name="wb_open"></function_call>',
  ])('suppresses native control markup even across streamed chunk boundaries: %s', (raw) => {
    expect(looksLikeStructuredFragment(raw)).toBe(true);
    for (const size of [1, 7, raw.length]) {
      const parsed = parseStream(raw, size);
      expect(parsed.text).toBe('');
      expect(parsed.actions).toEqual([]);
      expect(parsed.results.at(-1)?.isDone).toBe(true);
    }
  });

  it.each([
    '先口頭說明。<tool_call>wb_open<arg_key>content</arg_key><arg_value>PRIVATE_CONTROL_SENTINEL</arg_value></tool_call>然後繼續。',
    '<tool_call>wb_open</tool_call>這是後續正文。',
    JSON.stringify([{ type: 'text', content: '說明。<tool_call>wb_open<arg_key>content</arg_key><arg_value>PRIVATE_CONTROL_SENTINEL</arg_value></tool_call>繼續。' }]),
    JSON.stringify([{ type: 'text', content: '<arg_key>content</arg_key><arg_value>PRIVATE_CONTROL_SENTINEL</arg_value>' }]),
    '<tool_ca',
    '口頭前文。<tool_ca',
    '[{"type":"text","content":"口頭說明。<tool_ca',
  ])('does not leak mixed, JSON-embedded or incomplete native control text: %s', (raw) => {
    for (const size of [1, 3, 11, raw.length]) {
      const parsed = parseStream(raw, size);
      expect(parsed.text).not.toMatch(/<\/?(?:tool|arg|function)|wb_open|PRIVATE_CONTROL_SENTINEL/i);
      expect(parsed.text).not.toContain('<');
      expect(parsed.actions).toEqual([]);
      expect(parsed.results.at(-1)?.isDone).toBe(true);
    }
  });

  it.each(['卡甘研究的是某些催化反應的非線性效應。', '我們用物件 {"name":"樹"} 表示一棵樹。'])('keeps genuine prose visible: %s', (speech) => {
    expect(looksLikeStructuredFragment(speech)).toBe(false);
    const parsed = parseStream(speech, 3);
    expect(parsed.text).toBe(speech);
    expect(parsed.actions).toEqual([]);
  });

  it('still parses legal JSON speech and action objects in their original order', () => {
    const text = JSON.stringify([{ type: 'text', content: '我先口頭解釋。' }, { type: 'action', name: 'wb_open', params: {} }, { type: 'text', content: '這是按要求畫圖的補充。' }]);
    const parsed = parseStream(text, 11);
    expect(parsed.text).toBe('我先口頭解釋。這是按要求畫圖的補充。');
    expect(parsed.actions.map((action) => action.actionName)).toEqual(['wb_open']);
    expect(parsed.results.flatMap((result) => result.ordered.map((entry) => entry.type))).toContain('action');
  });
});

describe('actual legacy graph uses the same prompt and execution action list', () => {
  it.each([
    [nobelId, '請用一個生活類比解釋。', false],
    [nobelId, '請在白板畫圖解釋。', true],
    ['ordinary-course', '請用一個生活類比解釋。', true],
  ] as const)('enforces %s / %s in generated events', async (stageId, text, expectWhiteboard) => {
    let actualPrompt = '';
    const generated = JSON.stringify([{ type: 'action', name: 'wb_open', params: {} }, { type: 'text', content: '這是清楚的口頭解釋。' }]);
    const stream = vi.spyOn(AISdkLangGraphAdapter.prototype, 'streamGenerate').mockImplementation(async function* (messages): ReturnType<AISdkLangGraphAdapter['streamGenerate']> {
      actualPrompt = String(messages[0].content);
      yield { type: 'delta', content: generated };
      yield { type: 'done', content: generated };
    });
    const request: StatelessChatRequest = {
      apiKey: 'synthetic-test-never-used',
      messages: [{ id: 'user-1', role: 'user', parts: [{ type: 'text', text }] }],
      storeState: storeState(stageId),
      config: { agentIds: [agent.id], sessionType: 'qa', agentConfigs: [agent] },
    };
    const events: StatelessEvent[] = [];
    for await (const event of statelessGenerate(request, new AbortController().signal, {} as LanguageModel)) events.push(event);
    expect(stream).toHaveBeenCalledOnce();
    expect(events.filter((event) => event.type === 'error')).toEqual([]);
    expect(events.filter((event) => event.type === 'action').map((event) => event.data.actionName)).toEqual(expectWhiteboard ? ['wb_open'] : []);
    expect(events.filter((event) => event.type === 'text_delta').map((event) => event.data.content).join('')).toBe('這是清楚的口頭解釋。');
    if (stageId === nobelId) {
      expect(actualPrompt).toContain(expectWhiteboard ? 'The learner requested drawing:' : 'No drawing actions are available this turn.');
    } else expect(actualPrompt).not.toContain('# Ordinary Nobel lecture conversation');
  });
});
