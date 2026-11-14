'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStageStore } from '@/lib/store';
import { getNobelClassroomId, getNobelVoicePair, getNobelVoiceTarget, getNobelVoiceHref, getNobelVoiceDescription } from '@/lib/learner/nobel-language-navigation';
import { useI18n } from '@/lib/hooks/use-i18n';
import { supportedLocales, type Locale } from '@/lib/i18n';
import { learnerLocales } from '@/lib/i18n/locales';
import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  /** Called when the dropdown opens, so parent can close sibling dropdowns. */
  onOpen?: () => void;
}

/**
 * Locale picker pill. Backed by Radix DropdownMenu so its content is
 * portaled to `document.body` — important inside Pro mode's CommandBar
 * (which lives under an `overflow-hidden` canvas slot that would
 * otherwise clip the dropdown).
 */
export function LanguageSwitcher({ onOpen }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const learnerDeployment = isLearnerDeployment();
  const localeOptions = learnerDeployment ? learnerLocales : supportedLocales;
  const pathname = usePathname();
  const classroomId = learnerDeployment ? getNobelClassroomId(pathname) : null;
  const voicePair = getNobelVoicePair(classroomId);
  const mandarinVoice = voicePair?.mandarin;
  const pendingVoiceTarget = useRef<string | null>(null);

  // Keep the active voice and Chinese UI in sync even after hydration. A
  // user-initiated counterpart navigation is the only temporary exception.
  useEffect(() => {
    if (!learnerDeployment || pendingVoiceTarget.current) return;
    if (classroomId) {
      const expected = mandarinVoice ? 'zh-CN' : 'zh-TW';
      if (locale !== 'en-US' && locale !== expected) setLocale(expected);
    } else if (!learnerLocales.some((option) => option.code === locale)) {
      setLocale('zh-TW');
    }
  }, [learnerDeployment, classroomId, mandarinVoice, locale, setLocale]);

  const selectLanguage = (nextLocale: Locale) => {
    const target = classroomId ? getNobelVoiceTarget(classroomId, nextLocale) : null;
    pendingVoiceTarget.current = target;
    setLocale(nextLocale);
    if (!classroomId) return;
    if (!target) return; // English has no authored voice; preserve current audio.
    const state = useStageStore.getState();
    const order = state.stage?.id === classroomId ? state.getCurrentScene()?.order : undefined;
    const href = getNobelVoiceHref(target, order);
    // A new document releases old audio/SSE and loads the complete reviewed
    // counterpart, including its narration, teacher persona and ASR language.
    if (href) window.location.assign(href);
  };
  const combinedLabel = locale === 'en-US' ? 'Language and narration'
    : locale === 'zh-CN' ? '语言与讲解' : '語言與講解';


  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (open) onOpen?.();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button aria-label={voicePair ? combinedLabel : undefined} title={voicePair ? combinedLabel : undefined} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 hover:shadow-sm transition-all">
          {localeOptions.find((l) => l.code === locale)?.shortLabel ?? locale}
          {voicePair && <span aria-hidden="true"> · {voicePair.mandarin ? '普' : '粵'}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[120px]">
        {localeOptions.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => selectLanguage(l.code)}
            aria-label={l.label}
            aria-description={classroomId ? getNobelVoiceDescription(classroomId, l.code) : undefined}
            className={cn(
              'cursor-pointer',
              locale === l.code &&
                'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
            )}
          >
            <span>{l.label}</span>
            {classroomId && <span aria-hidden="true" className="ml-3 text-[11px] text-gray-500 dark:text-gray-400">{getNobelVoiceDescription(classroomId, l.code)}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

