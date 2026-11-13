// @vitest-environment jsdom
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useDiscussionTTS } from '@/lib/hooks/use-discussion-tts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const mocks = vi.hoisted(() => ({
  warning: vi.fn(() => 1), error: vi.fn(), dismiss: vi.fn(),
  settings: { ttsProvidersConfig: {}, ttsSpeed: 1, ttsMuted: false, ttsVolume: 1,
    playbackSpeed: 1, ttsProviderId: 'edge-tts', ttsVoice: '', agentVoiceOverrides: {} },
}));
vi.mock('@/lib/store/settings', () => ({ useSettingsStore: (selector: (s: typeof mocks.settings) => unknown) => selector(mocks.settings) }));
vi.mock('@/lib/config/deployment-mode', () => ({ isLearnerDeployment: () => true }));
vi.mock('@/lib/hooks/use-i18n', () => ({ useI18n: () => ({ locale: 'zh-TW', t: (key: string) => key }) }));
vi.mock('@/lib/hooks/use-browser-tts', () => ({ useBrowserTTS: () => ({ speak: vi.fn(), pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() }) }));
vi.mock('@/lib/audio/voxcpm-voices', () => ({ useAllVoiceProfiles: () => ({ profiles: [] }) }));
vi.mock('@/lib/audio/voice-resolver', () => ({ resolveAgentVoice: vi.fn(), resolveNarratorVoiceBinding: vi.fn(), getSelectableProvidersWithVoices: () => [] }));
vi.mock('@/lib/audio/provider-enablement', () => ({ isTTSProviderEnabled: () => true }));
vi.mock('@/lib/audio/agent-voice', () => ({ resolveAgentVoiceOptions: vi.fn() }));
vi.mock('@/lib/audio/constants', () => ({ isQwenCloneVoice: () => false, resolveTTSModelForVoice: () => undefined }));
vi.mock('@/lib/audio/unavailable-voice-bindings', () => ({
  isVoiceBindingUnavailable: () => false, markVoiceBindingUnavailable: vi.fn(),
  markVoiceBindingNoticeShown: vi.fn(), trackAssignedVoiceBinding: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { warning: mocks.warning, error: mocks.error, dismiss: mocks.dismiss } }));
const agents = [{ id: 'teacher', role: 'teacher' }] as any;
let api: ReturnType<typeof useDiscussionTTS>;
let root: Root, container: HTMLDivElement;
let request: ReturnType<typeof vi.fn>;
let play: ReturnType<typeof vi.fn>;
const audios: any[] = [];
const response = () => new Response(JSON.stringify({ base64: 'AA==', format: 'mp3' }), { status: 200 });
function deferred<T>() { let resolve!: (value:T)=>void, reject!: (error:unknown)=>void;
  const promise=new Promise<T>((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}; }
async function flush() { await act(async()=>{for(let i=0;i<12;i++)await Promise.resolve()}); }
function Harness() { api=useDiscussionTTS({enabled:true,classroomId:'course',agents});return null; }
function send(id:string) { act(()=>api.handleSegmentSealed(id,id,'孩子的問題','teacher')); }
beforeEach(async()=>{
  vi.clearAllMocks();audios.length=0;request=vi.fn();play=vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('fetch',request);
  vi.stubGlobal('Audio',class {src='';paused=true;volume=1;playbackRate=1;onended:any=null;onerror:any=null;
    constructor(){audios.push(this)} pause(){this.paused=true} play(){this.paused=false;return play()}});
  container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  await act(async()=>root.render(createElement(Harness)));
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals()});
describe('learner TTS hook recovery and session ownership',()=>{
  it('plays once after one gateway failure',async()=>{
    request.mockResolvedValueOnce(new Response('gateway',{status:502})).mockResolvedValueOnce(response());
    send('one');await flush();
    expect(request).toHaveBeenCalledTimes(2);expect(play).toHaveBeenCalledTimes(1);
    expect(api.shouldHold()).toEqual({holding:true,segmentDone:0});
    act(()=>audios[0].onended());await flush();
    expect(api.shouldHold()).toEqual({holding:false,segmentDone:1});
  });
  it('does not let an old late failure release the new segment',async()=>{
    const old=deferred<Response>();request.mockReturnValueOnce(old.promise).mockResolvedValueOnce(response());
    send('old');act(()=>api.cleanup());send('new');await flush();
    old.resolve(new Response('gateway',{status:502}));await flush();
    expect(request).toHaveBeenCalledTimes(2);expect(play).toHaveBeenCalledTimes(1);
    expect(api.shouldHold()).toEqual({holding:true,segmentDone:0});expect(mocks.warning).not.toHaveBeenCalled();
  });
  it('ignores old autoplay rejection after a new segment starts',async()=>{
    const old=deferred<void>();request.mockImplementation(async()=>response());
    play.mockReturnValueOnce(old.promise).mockResolvedValue(undefined);
    send('old');await flush();act(()=>api.cleanup());send('new');await flush();
    old.reject(new DOMException('blocked','NotAllowedError'));await flush();
    expect(api.shouldHold()).toEqual({holding:true,segmentDone:0});expect(mocks.warning).not.toHaveBeenCalled();
    act(()=>audios[0].onended());await flush();
    expect(api.shouldHold()).toEqual({holding:false,segmentDone:1});
  });
  it('does not let old toast controls pause or skip a new segment',async()=>{
    request.mockImplementation(async()=>response());
    play.mockRejectedValueOnce(new DOMException('blocked','NotAllowedError')).mockResolvedValue(undefined);
    send('old');await flush();expect(mocks.warning).toHaveBeenCalledTimes(1);
    const options=(mocks.warning.mock.calls[0] as any)[1];
    act(()=>api.cleanup());send('new');await flush();
    const count=play.mock.calls.length;
    act(()=>{options.action.onClick();options.cancel.onClick()});await flush();
    expect(play).toHaveBeenCalledTimes(count);
    expect(api.shouldHold()).toEqual({holding:true,segmentDone:0});
  });

  it('retains a new blocked-playback toast when an old button fires late',async()=>{
    request.mockImplementation(async()=>response());
    mocks.warning.mockReturnValueOnce(101).mockReturnValueOnce(202);
    play.mockRejectedValue(new DOMException('blocked','NotAllowedError'));
    send('old');await flush();
    const options=(mocks.warning.mock.calls[0] as any)[1];
    act(()=>api.cleanup());send('new');await flush();
    expect(mocks.warning).toHaveBeenCalledTimes(2);
    act(()=>{options.action.onClick();options.cancel.onClick()});
    act(()=>api.cleanup());
    expect(mocks.dismiss).toHaveBeenLastCalledWith(202);
  });

});

