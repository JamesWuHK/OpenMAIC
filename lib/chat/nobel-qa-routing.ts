interface ClassroomAgent {
  id: string;
  name: string;
  role: string;
}

interface NobelQuestionRouting {
  learnerDeployment: boolean;
  stageId?: string;
  sessionType: string;
  question: string;
  selectedAgentIds: readonly string[];
  agents: readonly ClassroomAgent[];
}

// This normalizes role/name labels only, not the student's scientific question.
const labelCharacters: Record<string, string> = {
  諾: '诺', 獎: '奖', 師: '师', 證: '证', 據: '据', 學: '学',
};
const label = (value: string) => value.replace(/[諾獎師證據學]/g, character => labelCharacters[character]);

/** Ordinary Nobel lecture questions wait for the child after the requested reply.
 * Explicit requests for a group discussion retain the selected classroom roster.
 * Other courses, authoring and scripted discussion sessions retain their policy.
 */
export function selectNobelQuestionAgentIds(input: NobelQuestionRouting): string[] {
  const selected = [...input.selectedAgentIds];
  if (!input.learnerDeployment || input.sessionType !== 'qa' ||
      !/^hk-nobel-\d{2}-[a-z0-9-]+-lecture-v\d+$/.test(input.stageId ?? '')) return selected;
  const available = input.agents.filter(agent => selected.includes(agent.id));
  if (!available.length) return selected;
  const question = input.question.trim();
  const clauses = question.split(/[，,。.!！?？;；]/).map(clause => clause.trim()).filter(Boolean);
  // A negated invitation is not permission to recruit extra speakers. Ambiguous
  // requests retain the ordinary single-teacher default.
  const negativeGroup = /(?:不要|不用|不必|不想|不需要|毋須|毋须|無須|无需|別|别|不是)[^，,。.!！?？;；]{0,24}(?:大家|你們|你们|全班|所有角色|全部角色|三位角色|三個角色|三个角色|一起|多角度|各自|輪流|轮流)|(?:大家|你們|你们|全班|所有角色|全部角色|三位角色|三個角色|三个角色)[^，,。.!！?？;；]{0,8}(?:不要|不用|不必|別|别)[^，,。.!！?？;；]{0,8}(?:一起|討論|讨论|回答|解釋|解释|發言|发言)/;
  const openingOf = (clause: string) => clause.replace(/^(?:只(?:想|要)?\s*)?(?:請|请|麻煩|麻烦|讓|让)?\s*/, '');
  const isNegatedInvitation = (opening: string) => /不要|不用|不必|不想|不需要|毋須|毋须|無須|无需|別|别|不是/.test(
    opening.split(/回答|發言|发言|解釋|解释|補充|补充|討論|讨论|提出|介紹|介绍|說|说|講|讲/)[0],
  );
  for (const clause of clauses) {
    if (negativeGroup.test(clause)) continue;
    const opening = openingOf(clause);
    if (isNegatedInvitation(opening)) continue;
    if (/^(?:大家|你們|你们|全班|(?:所有|全部|三個|三个|三位)角色)(?=一起|從|从|用|來|来|討論|讨论|回答|解釋|解释|交流|各自|輪流|轮流|\s|$)/.test(opening)) return selected;
    const actionAt = opening.search(/用|來|来|解釋|解释|回答|說|说|講|讲|提出|介紹|介绍|補充|补充|一起|各自|多角度|輪流|轮流/);
    const startsWithSpeaker = available.some(agent => label(opening).startsWith(label(agent.name))) ||
      /^(?:諾獎故事|诺奖故事|證據小|证据小|小|好奇)?(?:老師|老师|助教|助手|同學|同学)/.test(opening);
    if (startsWithSpeaker && actionAt >= 0) {
      const invitation = opening.slice(0, actionAt);
      const requestedRoles = new Set([
        /老師|老师/.test(invitation) && 'teacher',
        /助教|助手/.test(invitation) && 'assistant',
        /同學|同学/.test(invitation) && 'student',
      ].filter(Boolean));
      if (requestedRoles.size >= 2 && /和|與|与|及|跟|、/.test(invitation) && !/或|還是|还是/.test(invitation)) return available.filter(agent => requestedRoles.has(agent.role)).map(agent => agent.id);
    }
  }
  const addressed = new Set<string>();
  for (const clause of clauses) {
    const opening = openingOf(clause);
    if (isNegatedInvitation(opening)) continue;
    const named = available.filter(agent => label(opening).startsWith(label(agent.name)) && !/^(?:不要|不用|不必|別|别)/.test(opening.slice(agent.name.length)));
    if (named.length === 1) { addressed.add(named[0].id); continue; }
    const roleRequest = opening.match(/^(?:諾獎故事|诺奖故事|證據小|证据小|小|好奇)?(老師|老师|助教|助手|同學|同学)(?=用|來|来|解釋|解释|回答|說|说|講|讲|提出|介紹|介绍|補充|补充|[，,:：\s]|$)/);
    const requestedRole = roleRequest && ({ 老師: 'teacher', 老师: 'teacher', 助教: 'assistant', 助手: 'assistant', 同學: 'student', 同学: 'student' } as Record<string, string>)[roleRequest[1]];
    const agent = available.find(agent => agent.role === requestedRole);
    if (agent) addressed.add(agent.id);
  }
  if (addressed.size) return available.filter(agent => addressed.has(agent.id)).map(agent => agent.id);
  const target = available.find(agent => agent.role === 'teacher') ?? available[0];
  return [target.id];
}
