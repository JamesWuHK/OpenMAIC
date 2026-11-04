import { describe, expect, it } from 'vitest';
import { selectNobelQuestionAgentIds } from '@/lib/chat/nobel-qa-routing';

const agents = [
  { id: 't', name: '諾獎故事老師', role: 'teacher' },
  { id: 'a', name: '證據小助手', role: 'assistant' },
  { id: 's', name: '好奇同學', role: 'student' },
];
const base = { learnerDeployment: true, stageId: 'hk-nobel-07-sakaguchi-lecture-v1', sessionType: 'qa', selectedAgentIds: ['t', 'a', 's'], agents };
const route = (question: string, options = {}) => selectNobelQuestionAgentIds({ ...base, question, ...options });

describe('ordinary Nobel lecture question routing', () => {
  it('answers an ordinary question with the teacher without recruiting another student', () => {
    expect(route('免疫系統為甚麼也需要約束？')).toEqual(['t']);
  });
  it.each([
    ['請諾獎故事老師用廣東話解釋。', 't'],
    ['请诺奖故事老师用商场的比方回答。', 't'],
    ['请证据小助手用广东话解释研究限制。', 'a'],
    ['請助教回答這個問題。', 'a'],
    ['请好奇同学用广东话提出一个科学疑问。', 's'],
    ['請同學提出一個問題。', 's'],
  ])('honors the explicitly addressed role: %s', (question, id) => {
    expect(route(question)).toEqual([id]);
  });
  it.each(['請大家一起討論。', '请大家从多角度解释。', '請三位角色回答。'])('retains the roster for explicit group intent: %s', question => {
    expect(route(question)).toEqual(['t', 'a', 's']);
  });
  it('keeps a named subset for a requested discussion and does not equate multiple angles with multiple speakers', () => {
    expect(route('请老师和助教各自补充。')).toEqual(['t', 'a']);
    expect(route('请老师从多角度解释。')).toEqual(['t']);
    expect(route('请从多角度解释。')).toEqual(['t']);
  });
  it.each([
    ['請老師回答，不要大家一起討論', ['t']],
    ['不要全班討論，只請老師回答', ['t']],
    ['请大家不要一起讨论，只请证据小助手回答', ['a']],
    ['不是大家一起讨论，只请好奇同学提出问题', ['s']],
    ['不要只让老师回答，请所有角色一起讨论', ['t', 'a', 's']],
    ['請所有角色解釋為甚麼不是現成療法', ['t', 'a', 's']],
    ['請老師或助教回答', ['t']],
    ['请老师解释“大家一起讨论”是什么意思', ['t']],
    ['请老师解释全班讨论有什么好处', ['t']],
    ['请诺奖故事老师不要回答，只请证据小助手回答', ['a']],
    ['请老师和助教不要回答，只请好奇同学回答', ['s']],
    ['請老師、助教別回答，只請同學回答', ['s']],
    ['请诺奖故事老师和证据小助手不要回答，只请好奇同学回答', ['s']],
  ])('honors negative or ambiguous group invitations: %s', (question, ids) => {
    expect(route(question)).toEqual(ids);
  });
  it.each([
    { learnerDeployment: false }, { stageId: 'hk-t01-01-bus-eta' },
    { stageId: undefined }, { sessionType: 'discussion' },
  ])('leaves non-target contexts unchanged: %j', options => {
    expect(route('请证据小助手回答。', options)).toEqual(['t', 'a', 's']);
  });
  it.each([
    'hk-nobel-01-kagan-lecture-v4', 'hk-nobel-02-soai-lecture-v4',
    'hk-nobel-03-halzen-lecture-v3', 'hk-nobel-04-deisseroth-lecture-v2',
    'hk-nobel-05-hegemann-lecture-v1', 'hk-nobel-06-nagel-lecture-v1',
  ])('covers each currently published series lesson: %s', stageId => {
    expect(route('請助教回答。', { stageId })).toEqual(['a']);
  });
  it('never invents an unavailable or deselected speaker', () => {
    expect(route('请证据小助手回答。', { selectedAgentIds: ['t'] })).toEqual(['t']);
    expect(route('请老师回答。', { selectedAgentIds: ['default-1'] })).toEqual(['default-1']);
  });
  it('does not mutate the selected roster', () => {
    const selectedAgentIds = Object.freeze(['t', 'a', 's']);
    expect(route('請老師回答。', { selectedAgentIds })).toEqual(['t']);
    expect(selectedAgentIds).toEqual(['t', 'a', 's']);
  });
});
