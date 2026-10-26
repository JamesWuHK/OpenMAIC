import http from 'node:http';

// Isolated CI fixture. It never calls a model provider and must not be used
// for a public classroom or as evidence of teaching quality.
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
let requestCount = 0;

function chunk(delta, finishReason = null) {
  return JSON.stringify({
    id: 'chatcmpl-learner-synthetic',
    object: 'chat.completion.chunk',
    created: 1,
    model: 'gpt-4o-mini',
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  });
}

function reply(res, delta, finishReason) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache',
  });
  res.write(`data: ${chunk({ role: 'assistant' })}\n\n`);
  res.write(`data: ${chunk(delta)}\n\n`);
  res.write(`data: ${chunk({}, finishReason)}\n\n`);
  res.end('data: [DONE]\n\n');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, requests: requestCount }));
    return;
  }
  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    res.writeHead(404);
    res.end();
    return;
  }

  let raw = '';
  for await (const part of req) raw += part;
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400);
    res.end('Invalid JSON');
    return;
  }
  requestCount += 1;
  const names = new Set((body.tools || []).map((tool) => tool.function?.name));
  if (names.has('call_agent')) {
    const hasAgentTurn = (body.messages || []).some((message) => message.role === 'tool');
    const name = hasAgentTurn ? 'cue_user' : 'call_agent';
    const args = hasAgentTurn
      ? { prompt: '你還想試試甚麼方法？' }
      : { agentId: 'default-1', instruction: '用一句廣東話回答學生，再把話輪交還學生。' };
    reply(
      res,
      {
        tool_calls: [{
          index: 0,
          id: `call_synthetic_${requestCount}`,
          type: 'function',
          function: { name, arguments: JSON.stringify(args) },
        }],
      },
      'tool_calls',
    );
    return;
  }
  reply(
    res,
    { content: '[{"type":"text","content":"我哋可以先觀察，再一齊搵證據。"}]' },
    'stop',
  );
});

server.listen(port, host, () => {
  process.stdout.write(`Synthetic learner model listening on ${host}:${port}\n`);
});
