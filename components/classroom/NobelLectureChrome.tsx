'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Maximize, MessageCircle, Pause, Play, ScrollText, Volume2, VolumeX, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { Scene } from '@/lib/types/stage';

function useLabels() {
  const { locale } = useI18n();
  if (locale === 'en-US') return { series: 'Course series', course: 'Nobel stories', contents: 'Contents', script: 'Narration', interaction: 'Ask and discuss', previous: 'Previous', next: 'Next', play: 'Play narration', pause: 'Pause', fullscreen: 'Full screen', close: 'Close', empty: 'No narration on this page.', mute: 'Mute', unmute: 'Unmute', volume: 'Volume' };
  if (locale === 'zh-CN') return { series: '返回课程系列', course: '诺奖人物故事', contents: '目录', script: '讲稿', interaction: '提问讨论', previous: '上一页', next: '下一页', play: '播放讲解', pause: '暂停讲解', fullscreen: '全屏', close: '关闭', empty: '本页没有讲解音轨。', mute: '静音', unmute: '取消静音', volume: '音量' };
  return { series: '返回課程系列', course: '諾獎人物故事', contents: '目錄', script: '講稿', interaction: '課堂提問', previous: '上一頁', next: '下一頁', play: '播放講解', pause: '暫停講解', fullscreen: '全螢幕', close: '關閉', empty: '本頁沒有講解音軌。', mute: '靜音', unmute: '取消靜音', volume: '音量' };
}

export function NobelLectureHeader({ title }: { title: string }) {
  const l = useLabels();
  return <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-6 dark:border-slate-700 dark:bg-slate-950" data-testid="lecture-header">
    <Link href="/series/nobel-curiosity-lab" aria-label={l.series} title={l.series} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft size={20} /></Link>
    <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{l.course}</p><h1 className="truncate text-sm font-semibold sm:text-base" title={title}>{title}</h1></div>
    <LanguageSwitcher />
  </header>;
}

export function NobelLectureToolbar({ scenes, currentSceneId, currentIndex, playing, speech, muted, volume, interactionOpen, onInteractionToggle, onMute, onVolume, onSelect, onPrevious, onNext, onPlayPause, onFullscreen }: {
  muted: boolean; volume: number; onMute: () => void; onVolume: (volume: number) => void;
  scenes: Scene[]; currentSceneId: string | null; currentIndex: number; playing: boolean; speech: string;
  interactionOpen: boolean; onInteractionToggle: () => void;
  onSelect: (id: string) => void | Promise<boolean>; onPrevious: () => void; onNext: () => void; onPlayPause: () => void; onFullscreen: () => void;
}) {
  const l = useLabels();
  const [panel, setPanel] = useState<'contents' | 'script' | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const contentsRef = useRef<HTMLButtonElement>(null);
  const scriptRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggle = (next: 'contents' | 'script') => setPanel((current) => current === next ? null : next);
  const close = () => {
    const previous = panel;
    setPanel(null);
    (previous === 'contents' ? contentsRef : scriptRef).current?.focus();
  };
  useEffect(() => {
    if (!panel) return;
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
      if (e.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex="0"]');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
    // The open panel determines which toggle regains focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);
  const displayIndex = Math.min(Math.max(currentIndex, 0), Math.max(scenes.length - 1, 0));
  const button = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-slate-800';
  return <>
    {panel && <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/35 p-3 sm:items-center" onClick={close}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="lecture-panel-title" className="flex max-h-[80%] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-2"><h2 id="lecture-panel-title" className="font-semibold">{panel === 'contents' ? l.contents : l.script}</h2><button ref={closeRef} aria-label={l.close} className={button} onClick={close}><X size={20} /></button></div>
        <div className="overflow-y-auto overscroll-contain p-4">
          {panel === 'contents' ? <nav aria-label={l.contents} className="space-y-1">{scenes.map((scene, i) => <button key={scene.id} aria-current={scene.id === currentSceneId ? 'page' : undefined} onClick={() => { void onSelect(scene.id); close(); }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${scene.id === currentSceneId ? 'bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><span className="w-6 shrink-0 tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span><span>{scene.title}</span></button>)}</nav> : <p className="whitespace-pre-wrap text-base leading-8">{speech || l.empty}</p>}
        </div>
      </div>
    </div>}
    <footer data-testid="lecture-toolbar" className="relative z-50 shrink-0 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] dark:border-slate-700 dark:bg-slate-950">
      <div className="h-0.5 bg-slate-100 dark:bg-slate-800"><div className="h-full bg-teal-600 transition-[width]" style={{ width: `${((displayIndex + 1) / Math.max(scenes.length, 1)) * 100}%` }} /></div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-1 py-1 sm:py-2">
        <div className="flex items-center"><button ref={contentsRef} className={button} aria-haspopup="dialog" aria-expanded={panel === 'contents'} onClick={() => toggle('contents')}><List size={18} /><span>{l.contents}</span></button><span className="px-2 text-xs tabular-nums text-slate-500" aria-live="polite">{displayIndex + 1} / {scenes.length}</span></div>
        <div className="order-last flex w-full items-center justify-center gap-2 sm:order-none sm:w-auto">
          <button className={button} disabled={currentIndex <= 0} aria-label={l.previous} onClick={onPrevious}><ChevronLeft size={20} /><span>{l.previous}</span></button>
          <button className={`${button} min-w-32 bg-teal-700 text-white hover:bg-teal-800 dark:hover:bg-teal-600`} aria-label={playing ? l.pause : l.play} onClick={onPlayPause}>{playing ? <Pause size={20} /> : <Play size={20} />}<span>{playing ? l.pause : l.play}</span></button>
          <button className={button} disabled={currentIndex >= scenes.length - 1} aria-label={l.next} onClick={onNext}><span>{l.next}</span><ChevronRight size={20} /></button>
        </div>
        <div className="flex items-center"><button className={button} aria-label={muted ? l.unmute : l.mute} onClick={onMute}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input type="range" min="0" max="1" step="0.1" value={volume} aria-label={l.volume} onChange={(e) => onVolume(Number(e.target.value))} className="hidden w-16 accent-teal-700 lg:block" /><button className={`${button} ${interactionOpen ? 'bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : ''}`} aria-label={l.interaction} aria-expanded={interactionOpen} aria-controls="nobel-classroom-interaction" onClick={onInteractionToggle}><MessageCircle size={18} /><span>{l.interaction}</span></button><button ref={scriptRef} className={button} aria-haspopup="dialog" aria-expanded={panel === 'script'} onClick={() => toggle('script')}><ScrollText size={18} /><span>{l.script}</span></button><button className={button} aria-label={l.fullscreen} title={l.fullscreen} onClick={onFullscreen}><Maximize size={18} /></button></div>
      </div>
    </footer>
  </>;
}
