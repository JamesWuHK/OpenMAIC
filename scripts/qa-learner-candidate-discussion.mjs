const baseUrl = process.env.LEARNER_QA_CANDIDATE_URL;
if (!baseUrl) throw new Error('LEARNER_QA_CANDIDATE_URL is required');

const startedAt = performance.now();
const response = await fetch(new URL('/api/chat/pi', baseUrl), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    messages: [{
      id: 'synthetic-learner-turn',
      role: 'user',
      parts: [{ type: 'text', text: '我可以點樣觀察？' }],
    }],
    storeState: {
      stage: { id: 'synthetic-stage', name: 'Synthetic discussion smoke', whiteboard: [] },
      scenes: [],
      currentSceneId: null,
      mode: 'playback',
      whiteboardOpen: false,
    },
    config: {
      sessionType: 'qa',
      agentIds: ['default-1'],
      agentConfigs: [{
        id: 'default-1',
        name: 'Teacher',
        role: 'teacher',
        persona: 'Answer the learner briefly.',
        priority: 10,
        avatar: '',
        color: '#3366ff',
        allowedActions: [],
      }],
      piMaxAgentTurns: 1,
    },
  }),
  signal: AbortSignal.timeout(45_000),
});

const stream = await response.text();
if (!response.ok) {
  throw new Error(`Synthetic discussion HTTP ${response.status}: ${stream.slice(0, 500)}`);
}
const events = stream.split('\n\n')
  .map((part) => part.split('\n').find((line) => line.startsWith('data: ')))
  .filter(Boolean)
  .map((line) => JSON.parse(line.slice(6)));
const types = events.map((event) => event.type);
if (types.includes('error')) {
  throw new Error(`Synthetic discussion emitted error: ${JSON.stringify(events.find((e) => e.type === 'error'))}`);
}
for (const required of ['text_delta', 'cue_user', 'done']) {
  if (!types.includes(required)) {
    throw new Error(`Synthetic discussion missing ${required}; observed ${types.join(', ')}`);
  }
}
const text = events.filter((event) => event.type === 'text_delta')
  .map((event) => event.data?.content || '')
  .join('');
if (!text.includes('觀察')) throw new Error(`Unexpected synthetic teacher text: ${text}`);
const done = events.find((event) => event.type === 'done');
if (done?.data?.totalAgents !== 1 || done?.data?.cueUserReceived !== true) {
  throw new Error(`Synthetic discussion did not hand back a single agent turn: ${JSON.stringify(done)}`);
}
console.log(JSON.stringify({
  result: 'PASS',
  scope: 'synthetic model-backed Pi API, not real provider or browser audio',
  elapsedMs: Math.round(performance.now() - startedAt),
  eventTypes: types,
  teacherText: text,
}));
