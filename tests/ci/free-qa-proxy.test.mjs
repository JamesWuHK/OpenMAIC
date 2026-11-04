import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createFreeProxy} from '../../scripts/qa/openrouter-free-proxy.mjs';

const token = 'test-only-ephemeral-token-32-characters';
async function fixture(options, run) {
  const calls = [];
  const server = createFreeProxy({apiKey: 'test-upstream-key', token, fetchImpl: async (...args) => {
    calls.push(args);
    return new Response('data: {"reply":"test"}\n\n', {headers: {'content-type': 'text/event-stream'}});
  }, ...options});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (body, path = '/v1/chat/completions', auth = token) => fetch(base + path, {
    method: 'POST', headers: {'Authorization': 'Bearer ' + auth, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  try {await run(request, calls, {server, base});}
  finally {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
}
const payload = {model: 'openrouter/free', messages: [{role: 'user', content: 'Synthetic QA'}], stream: true};

test('relay rejects unauthorized and paid/fallback requests without upstream contact', async () => {
  await fixture({}, async (request, calls) => {
    assert.equal((await request(payload, undefined, 'wrong')).status, 401);
    assert.equal((await request({...payload, model: 'paid/model'})).status, 403);
    assert.equal((await request({...payload, models: ['paid/model']})).status, 403);
    assert.equal((await request({...payload, route: 'fallback'})).status, 403);
    assert.equal((await request({...payload, plugins: [{id: 'web'}]})).status, 403);
    assert.equal((await request({...payload, messages: [{role: 'user', content: [{type: 'file', file: {file_data: 'test.pdf'}}]}]})).status, 403);
    assert.equal((await request({...payload, tools: [{type: 'web_search'}]})).status, 403);
    assert.equal((await request(payload, '/user/balance')).status, 404);
    assert.equal(calls.length, 0);
  });
});
test('free SSE request uses only the server credential and limits generated tokens', async () => {
  await fixture({}, async (request, calls) => {
    const response = await request({...payload, max_tokens: 99999});
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Synthetic|reply/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(calls[0][1].headers.Authorization, 'Bearer test-upstream-key');
    assert.equal(JSON.parse(calls[0][1].body).model, 'openrouter/free');
    assert.equal(JSON.parse(calls[0][1].body).max_tokens, 2048);
  });
});
test('standard text-only message parts are permitted without multimodal preprocessing', async () => {
  await fixture({}, async (request, calls) => {
    const response = await request({...payload, messages: [{role: 'user', content: [{type: 'text', text: 'Synthetic QA'}]}]});
    assert.equal(response.status, 200); await response.text(); assert.equal(calls.length, 1);
  });
});
test('session ends at its fixed request budget and lifetime', async () => {
  await fixture({maxRequests: 1}, async (request, calls) => {
    await (await request(payload)).text();
    assert.equal((await request(payload)).status, 410);
    assert.equal(calls.length, 1);
  });
  await fixture({lifetimeMs: 0}, async (request, calls) => {
    assert.equal((await request(payload)).status, 410);
    assert.equal(calls.length, 0);
  });
});
test('oversized requests never reach the provider', async () => {
  await fixture({}, async (request, calls) => {
    assert.equal((await request({...payload, extra: 'a'.repeat(262145)})).status, 413);
    assert.equal(calls.length, 0);
  });
});

test('concurrent requests cannot exceed the fixed total budget', async () => {
  let release;
  let entered;
  const started = new Promise(resolve => {entered = resolve;});
  const pending = new Promise(resolve => {release = resolve;});
  await fixture({maxRequests: 1, fetchImpl: async () => {
    entered(); await pending; return new Response('ok');
  }}, async request => {
    const first = request(payload);
    await started;
    try {assert.equal((await request(payload)).status, 410);}
    finally {release(); await (await first).text();}
  });
});
test('completion-token request does not forward conflicting max_tokens', async () => {
  await fixture({}, async (request, calls) => {
    await (await request({...payload, max_completion_tokens: 9000})).text();
    const upstream = JSON.parse(calls[0][1].body);
    assert.equal(upstream.max_completion_tokens, 2048);
    assert.equal('max_tokens' in upstream, false);
  });
});
test('a slow body cannot reserve a request before the total budget is consumed', async () => {
  await fixture({maxRequests: 1}, async (request, calls, {server, base}) => {
    let ready;
    const bodyStarted = new Promise(resolve => {ready = resolve;});
    server.once('request', ready);
    const raw = JSON.stringify(payload);
    let finishBody;
    const first = new Promise((resolve, reject) => {
      const pending = http.request(base + '/v1/chat/completions', {method: 'POST', headers: {
        Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
      }}, response => {response.resume(); response.on('end', () => resolve(response.statusCode));});
      pending.on('error', reject);
      finishBody = () => pending.end(raw.slice(1));
      pending.write(raw.slice(0, 1));
    });
    await bodyStarted;
    try {await (await request(payload)).text();}
    finally {finishBody();}
    assert.equal(await first, 410);
    assert.equal(calls.length, 1);
  });
});

test('request deadline terminates a stalled body and releases its concurrency slot', async () => {
  await fixture({requestTimeoutMs: 30, maxConcurrent: 1}, async (request, calls, {server, base}) => {
    let seen;
    const started = new Promise(resolve => {seen = resolve;});
    server.once('request', seen);
    const pending = http.request(base + '/v1/chat/completions', {method: 'POST', headers: {
      Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
    }}, res => res.resume());
    pending.on('error', () => {});
    pending.write('{');
    await started;
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const response = await request(payload);
      assert.equal(response.status, 200);
      await response.text();
      assert.equal(calls.length, 1);
    } finally {pending.destroy();}
  });
});

test('TLS relay accepts only the explicit ephemeral CA without disabling certificate verification', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'free-qa-tls-test-'));
  const config = path.join(directory, 'openssl.cnf');
  const keyPath = path.join(directory, 'key.pem');
  const certPath = path.join(directory, 'cert.pem');
  fs.writeFileSync(config, '[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n[dn]\nCN=qa-test.invalid\n[v3]\nsubjectAltName=IP:127.0.0.1\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,digitalSignature,keyEncipherment\n');
  let server;
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
      '-config', config, '-keyout', keyPath, '-out', certPath], {stdio: 'ignore'});
    const cert = fs.readFileSync(certPath);
    server = createFreeProxy({apiKey: 'test-upstream-key', token,
      tls: {key: fs.readFileSync(keyPath), cert}, fetchImpl: async () => new Response('data: test\n\n')});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'https://127.0.0.1:' + server.address().port + '/v1/chat/completions';
    await new Promise((resolve, reject) => {
      const request = https.request(url, {ca: cert, method: 'POST', headers: {
        Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
      }}, response => {
        let text = '';
        response.on('data', chunk => {text += chunk;});
        response.on('end', () => {
          try {assert.equal(response.statusCode, 200); assert.match(text, /data: test/); resolve();}
          catch (error) {reject(error);}
        });
      });
      request.on('error', reject); request.end(JSON.stringify(payload));
    });
    await new Promise((resolve, reject) => {
      const request = https.get(url, () => reject(Error('Unexpected trust without the ephemeral CA')));
      request.on('error', error => {
        try {assert.match(error.code, /SELF_SIGNED|CERT/); resolve();} catch (failure) {reject(failure);}
      });
    });
  } finally {
    if (server) {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
