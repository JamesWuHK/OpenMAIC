import { describe, expect, it, vi } from 'vitest';
import { fetchLearnerDiscussionSpeech } from '@/lib/learner/fetch-discussion-speech';
describe('learner discussion speech gateway recovery', () => {
  const init = (signal = new AbortController().signal) => ({ method: 'POST', body: 'same request', signal });
  it.each([502,503,504])('retries one %s even with a non-JSON body', async status => {
    const request = vi.fn().mockResolvedValueOnce(new Response('<html>gateway</html>',{status})).mockResolvedValueOnce(new Response('{}',{status:200}));
    const options = init();
    expect((await fetchLearnerDiscussionSpeech(options,request)).status).toBe(200);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]).toEqual(request.mock.calls[1]);
  });
  it('stops after a second gateway failure', async () => {
    const request = vi.fn().mockImplementation(() => Promise.resolve(new Response('',{status:502})));
    expect((await fetchLearnerDiscussionSpeech(init(),request)).status).toBe(502);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it.each([400,401,403,404,429,500])('does not retry %s', async status => {
    const request = vi.fn().mockResolvedValue(new Response('',{status}));
    expect((await fetchLearnerDiscussionSpeech(init(),request)).status).toBe(status);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('does not retry a network exception', async () => {
    const request = vi.fn().mockRejectedValue(new TypeError('network'));
    await expect(fetchLearnerDiscussionSpeech(init(),request)).rejects.toThrow('network');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('does not start after cancellation', async () => {
    const controller=new AbortController();controller.abort();
    const request=vi.fn();
    await expect(fetchLearnerDiscussionSpeech(init(controller.signal),request)).rejects.toMatchObject({name:'AbortError'});
    expect(request).not.toHaveBeenCalled();
  });
  it('ignores a late gateway response after cancellation', async () => {
    const controller=new AbortController();
    const request=vi.fn().mockImplementation(async()=>{controller.abort();return new Response('',{status:502})});
    await expect(fetchLearnerDiscussionSpeech(init(controller.signal),request)).rejects.toMatchObject({name:'AbortError'});
    expect(request).toHaveBeenCalledTimes(1);
  });
});

