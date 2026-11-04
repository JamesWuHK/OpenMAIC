import assert from 'node:assert/strict';

// Validate the recorded public SSE protocol without retaining hidden reasoning.
export function assertChatBoundaries(requests) {
  assert.ok(requests.length > 0, 'No real chat request recorded');
  for (const request of requests) {
    assert.ok(request.finishedAt && !request.error, 'Chat request did not finish normally');
    const messages = new Map();
    let done = false;
    for (const event of request.events) {
      assert.equal(done, false, 'Public SSE event after done');
      assert.notEqual(event.type, 'error', 'Chat emitted an error');
      const data = event.data ?? {};
      if (event.type === 'agent_start') {
        assert.ok(typeof data.messageId === 'string' && data.messageId);
        assert.ok(typeof data.agentId === 'string' && data.agentId);
        assert.equal(messages.has(data.messageId), false, 'Duplicate message start');
        messages.set(data.messageId, {agentId: data.agentId, ended: false});
      } else if (event.type === 'text_delta') {
        const message = messages.get(data.messageId);
        assert.ok(message && !message.ended, 'Text outside an active message');
        assert.equal(typeof data.content, 'string');
      } else if (event.type === 'agent_end') {
        const message = messages.get(data.messageId);
        assert.ok(message && !message.ended, 'Missing or duplicate message end');
        assert.equal(data.agentId, message.agentId, 'Message ended under another role');
        message.ended = true;
      } else if (event.type === 'done') {
        assert.ok([...messages.values()].every(message => message.ended), 'Done before all messages ended');
        done = true;
      }
    }
    assert.equal(done, true, 'No terminal done');
  }
}
