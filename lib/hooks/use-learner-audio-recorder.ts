'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioBlobToWav } from '@/lib/audio/wav-utils';
import { useSettingsStore } from '@/lib/store/settings';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { UseAudioRecorderOptions } from './use-audio-recorder';

interface Session {
  stream?: MediaStream;
  recorder?: MediaRecorder;
  request: AbortController;
  timer?: ReturnType<typeof setInterval>;
}

/** Learner recordings use operator-owned ASR through the existing upload route. */
export function useLearnerAudioRecorder(options: UseAudioRecorderOptions) {
  const enabled = useSettingsStore(s => s.asrEnabled);
  const { locale } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const session = useRef<Session | null>(null);
  const callbacks = useRef(options);
  callbacks.current = options;

  const dispose = useCallback((s: Session) => {
    if (s.timer) clearInterval(s.timer);
    if (s.recorder) {
      s.recorder.onstop = null;
      s.recorder.ondataavailable = null;
      s.recorder.onerror = null;
      if (s.recorder.state !== 'inactive') s.recorder.stop();
    }
    s.stream?.getTracks().forEach(track => track.stop());
    s.request.abort();
  }, []);

  const cancelRecording = useCallback(() => {
    const previous = session.current;
    session.current = null;
    if (previous) dispose(previous);
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
  }, [dispose]);

  useEffect(() => {
    if (!enabled && session.current) cancelRecording();
  }, [enabled, cancelRecording]);

  useEffect(() => () => {
    const previous = session.current;
    session.current = null;
    if (previous) dispose(previous);
  }, [dispose]);

  const startRecording = useCallback(async () => {
    if (!enabled || session.current) return;
    const s: Session = { request: new AbortController() };
    session.current = s;
    setIsProcessing(true);
    const current = () => session.current === s;
    const fail = (message: string) => {
      if (current()) callbacks.current.onError?.(message);
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('這個瀏覽器不支援錄音，請改用文字輸入。');
      }
      s.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!current()) { dispose(s); return; }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(s.stream, mime ? { mimeType: mime } : undefined);
      s.recorder = recorder;
      const chunks: Blob[] = [];
      // Freeze the classroom language for this utterance; do not use a stale provider preference.
      const language = callbacks.current.recognitionLanguage || (locale === 'zh-TW' ? 'zh-HK' : locale);
      recorder.ondataavailable = event => {
        if (current() && event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (!current()) return;
        fail('錄音未能完成，請再試一次。');
        cancelRecording();
      };
      recorder.onstop = async () => {
        s.stream?.getTracks().forEach(track => track.stop());
        if (s.timer) clearInterval(s.timer);
        if (!current()) return;
        setIsRecording(false);
        setIsProcessing(true);
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const source = new Blob(chunks, { type: recorder.mimeType || mime || chunks[0]?.type });
          if (!source.size) throw new Error('未聽到你的問題，請再試一次。');
          // WAV is independent of the client's saved provider and also supports WAV-only backends.
          const wav = await audioBlobToWav(source);
          if (!current()) return;
          const form = new FormData();
          form.append('audio', wav, 'recording.wav');
          form.append('language', language);
          timeout = setTimeout(() => s.request.abort(), 60_000);
          const response = await fetch('/api/transcription', {
            method: 'POST', body: form, signal: s.request.signal,
          });
          const body = await response.json();
          if (!current()) return;
          if (!response.ok) throw new Error('暫時未能辨識，請再試一次或用文字提問。');
          if (typeof body.text !== 'string' || !body.text.trim()) {
            throw new Error('未聽清楚你的問題，請再說一次。');
          }
          callbacks.current.onTranscription?.(body.text.trim());
        } catch (error) {
          if (current()) fail(error instanceof Error && error.name !== 'AbortError'
            ? error.message : '語音識別逾時，請再試一次或用文字提問。');
        } finally {
          if (timeout) clearTimeout(timeout);
          if (current()) {
            session.current = null;
            dispose(s);
            setIsProcessing(false);
            setRecordingTime(0);
          }
        }
      };
      recorder.start();
      setIsProcessing(false);
      setIsRecording(true);
      setRecordingTime(0);
      s.timer = setInterval(() => {
        if (current()) setRecordingTime(value => value + 1);
      }, 1000);
    } catch (error) {
      if (current()) {
        fail(error instanceof Error && error.name !== 'NotAllowedError'
          ? error.message : '請允許使用咪高峰，或改用文字輸入。');
        cancelRecording();
      } else dispose(s);
    }
  }, [enabled, locale, cancelRecording, dispose]);

  const stopRecording = useCallback(() => {
    const s = session.current;
    if (s?.recorder?.state === 'recording') s.recorder.stop();
  }, []);

  return { isRecording, isProcessing, recordingTime, startRecording, stopRecording, cancelRecording };
}

