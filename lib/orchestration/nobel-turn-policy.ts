type Role = 'student' | 'teacher' | 'assistant';
type Decision =
  | { kind: 'agent'; agentId: string }
  | { kind: 'user'; fromAgentId: string }
  | { kind: 'empty-response-error'; agentId: string };

/** The six authored native lessons have a fixed introductory round. Avoid an
 * extra model call merely to choose each speaker. Other classrooms keep their
 * existing director, including configurations that do not match this contract.
 * Responses themselves remain freshly generated and use the existing prompts.
 */
export function decideNobelTurn(input: {
  learner: boolean;
  stageId: string | undefined;
  agents: ReadonlyArray<{ id: string; role: string }>;
  triggerAgentId: string | null;
  responses: ReadonlyArray<{ agentId: string; contentPreview: string }>;
}): Decision | null {
  const { learner, stageId, agents, triggerAgentId, responses } = input;
  if (!learner || !stageId ||
      !/^hk-nobel-(01-kagan|02-soai|03-halzen|04-deisseroth|05-hegemann|06-nagel)-discussion-v1$/.test(stageId)) return null;
  const roles: Role[] = ['student', 'teacher', 'assistant'];
  if (agents.length !== 3 || !roles.every(role =>
    agents.filter(a => a.id === `${stageId}-${role}` && a.role === role).length === 1)) return null;
  if (triggerAgentId && !agents.some(a => a.id === triggerAgentId)) return null;
  const order = triggerAgentId === `${stageId}-student`
    ? roles.map(role => `${stageId}-${role}`)
    : [triggerAgentId || `${stageId}-teacher`];
  for (const agentId of order) {
    const attempts = responses.filter(r => r.agentId === agentId);
    if (attempts.some(r => r.contentPreview.trim())) continue;
    // Keep all authored roles; never silently advance past an empty response.
    if (attempts.length >= 2) return { kind: 'empty-response-error', agentId };
    return { kind: 'agent', agentId };
  }
  return { kind: 'user', fromAgentId: order[order.length - 1] };
}
