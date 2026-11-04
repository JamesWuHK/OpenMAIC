import http from 'node:http';
import https from 'node:https';
import {timingSafeEqual} from 'node:crypto';
import {Readable} from 'node:stream';
import {pathToFileURL} from 'node:url';

// Ephemeral QA relay: the upstream credential stays on its existing host.
// The runner receives only a revocable relay token with no paid-model access.
export function createFreeProxy({apiKey, token, fetchImpl = fetch,
  maxRequests = 100, maxConcurrent = 2, lifetimeMs = 3600000, requestTimeoutMs = 90000, tls}) {
  if (!apiKey || !token || token.length < 32) throw Error('Missing relay credentials');
  const expected = Buffer.from('Bearer ' + token);
  const expires = Date.now() + lifetimeMs;
  const allowedFields = new Set(['model', 'messages', 'temperature', 'top_p',
    'presence_penalty', 'frequency_penalty', 'max_tokens', 'max_completion_tokens',
    'stream', 'stream_options', 'tools', 'tool_choice', 'parallel_tool_calls',
    'response_format', 'stop', 'seed', 'reasoning', 'include_reasoning', 'user']);
  const messageFields = new Set(['role', 'content', 'name', 'tool_call_id', 'tool_calls',
    'reasoning', 'reasoning_details']);
  const functionCall = value => value?.type === 'function' &&
    typeof value.function?.name === 'string' && typeof value.function?.arguments === 'string';
  const textContent = value => typeof value === 'string' || (Array.isArray(value) &&
    value.every(part => part?.type === 'text' && typeof part.text === 'string' &&
      Object.keys(part).every(key => key === 'type' || key === 'text')));
  const textMessage = value => value &&
    ['system', 'user', 'assistant', 'tool', 'developer', 'function'].includes(value.role) &&
    Object.keys(value).every(key => messageFields.has(key)) &&
    (textContent(value.content) || (value.content === null && value.tool_calls?.length > 0)) &&
    (!value.tool_calls || (Array.isArray(value.tool_calls) && value.tool_calls.every(functionCall)));
  let used = 0;
  let active = 0;
  const reject = (res, status, message) => {
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: message}));
  };
  const listener = async (req, res) => {
    const authorization = Buffer.from(req.headers.authorization || '');
    if (authorization.length !== expected.length || !timingSafeEqual(authorization, expected)) {
      return reject(res, 401, 'Invalid relay token');
    }
    if (req.method === 'GET' && req.url === '/health') {
      return reject(res, 200, 'Relay ready');
    }
    if (req.method !== 'POST' || !['/chat/completions', '/v1/chat/completions'].includes(req.url)) {
      return reject(res, 404, 'Unsupported relay operation');
    }
    if (Date.now() >= expires || used >= maxRequests) return reject(res, 410, 'Relay session ended');
    if (active >= maxConcurrent) return reject(res, 429, 'Relay busy');
    // Reserve a slot before reading the body, so slow senders are also bounded.
    active++;
    let released = false;
    const release = () => {if (!released) {released = true; active--;}};
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      req.destroy();
      res.destroy();
      release();
    }, requestTimeoutMs);
    res.on('close', () => {if (!res.writableEnded) controller.abort();});
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 262144) return reject(res, 413, 'Request exceeds relay limit');
        chunks.push(chunk);
      }
      let body;
      try {body = JSON.parse(Buffer.concat(chunks).toString('utf8'));}
      catch {return reject(res, 400, 'Invalid JSON');}
      if (!body || body.model !== 'openrouter/free' || Object.keys(body).some(key => !allowedFields.has(key))) {
        return reject(res, 403, 'Only the exact free router model is permitted');
      }
      if (!Array.isArray(body.messages) || !body.messages.length) return reject(res, 400, 'Messages required');
      if (!body.messages.every(textMessage) || (body.tools &&
          (!Array.isArray(body.tools) || !body.tools.every(tool => tool?.type === 'function' &&
            typeof tool.function?.name === 'string')))) {
        return reject(res, 403, 'Only text messages and declared client functions are permitted');
      }
      if (body.tool_choice && typeof body.tool_choice === 'object' &&
          (body.tool_choice.type !== 'function' || typeof body.tool_choice.function?.name !== 'string')) {
        return reject(res, 403, 'Only declared client functions are permitted');
      }
      // Cap output without ever substituting another model or provider.
      const boundedTokens = value => Number.isFinite(Number(value)) && Number(value) > 0
        ? Math.min(Math.floor(Number(value)), 2048) : 2048;
      if ('max_completion_tokens' in body) {
        body.max_completion_tokens = boundedTokens(body.max_completion_tokens);
        delete body.max_tokens;
      } else body.max_tokens = boundedTokens(body.max_tokens);
      // A request may have waited for its body while another consumed the budget.
      if (Date.now() >= expires || used >= maxRequests) return reject(res, 410, 'Relay session ended');
      used++;
      const upstream = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: {'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json'},
        body: JSON.stringify(body), signal: controller.signal,
      });
      if (!upstream.ok) return reject(res, 502, 'Free upstream returned HTTP ' + upstream.status);
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no',
      });
      if (upstream.body) {
        const stream = Readable.fromWeb(upstream.body);
        await new Promise((resolve, rejectStream) => {
          stream.on('error', rejectStream);
          res.on('error', rejectStream);
          res.on('finish', resolve);
          stream.pipe(res);
        });
      } else res.end();
    } catch {
      if (!res.destroyed && !res.headersSent) reject(res, 502, 'Free relay request failed');
      else res.destroy();
    } finally {
      clearTimeout(timer);
      release();
    }
  };
  return tls ? https.createServer(tls, listener) : http.createServer(listener);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.QA_TLS_KEY_BASE64 || !process.env.QA_TLS_CERT_BASE64) throw Error('Deployed relay requires TLS');
  const server = createFreeProxy({apiKey: process.env.OPENROUTER_API_KEY, token: process.env.QA_RELAY_TOKEN,
    tls: {key: Buffer.from(process.env.QA_TLS_KEY_BASE64, 'base64'),
      cert: Buffer.from(process.env.QA_TLS_CERT_BASE64, 'base64')}});
  server.requestTimeout = 95000;
  server.headersTimeout = 10000;
  server.listen(Number(process.env.PORT || 8787), '0.0.0.0', () => console.log('Free QA relay listening'));
  setTimeout(() => {server.closeAllConnections(); server.close();}, 3600000).unref();
}
