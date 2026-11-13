/** This series has separate voice variants; display script does not select ASR. */
export function nobelRecognitionLanguage(id?: string): 'zh-CN' | 'zh-HK' | undefined {
  if (!id || !/^hk-nobel-0[1-8]-[a-z0-9-]+$/.test(id)) return undefined;
  return id.endsWith('-mandarin') ? 'zh-CN' : 'zh-HK';
}

