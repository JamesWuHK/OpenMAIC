/** Keep provider diagnostics in logs, not in a child-facing PBL error banner. */
export function pblFailureMessage(
  kind: 'coach' | 'evaluation',
  language: string | undefined,
): string {
  if (language === 'en') {
    return kind === 'coach'
      ? 'The AI coach cannot respond right now. Please try again later, or tell your teacher if this continues.'
      : 'Review is temporarily unavailable. Your work is saved; retry the review later without submitting it again. Tell your teacher if this continues.';
  }
  if (language === 'zh-CN') {
    return kind === 'coach'
      ? 'AI 教练暂时无法回复。请稍后重试；如果持续失败，请告诉老师。'
      : '暂时无法评测。你的作品已保存，稍后可重新评测，无需重复提交；如果持续失败，请告诉老师。';
  }
  return kind === 'coach'
    ? 'AI 教練暫時未能回應。請稍後再試；若持續失敗，請告訴老師。'
    : '評測暫時未能完成。你的作品已保存，稍後可重新評測，毋須重複提交；若持續失敗，請告訴老師。';
}
