const STRONG_END = /[。！？!?；;\n]/u;
const MIN_CLAUSE_LENGTH = 12;

/** Return complete sentences for early speech synthesis and keep any open sentence buffered. */
export function takeCompleteSpeechSegments(input: string): {
  segments: string[];
  remainder: string;
} {
  const segments: string[] = [];
  let remainder = input;

  while (true) {
    const strongMatch = STRONG_END.exec(remainder);
    const softMatch =
      Array.from(remainder.matchAll(/[，,]/gu)).find(
        (candidate) => (candidate.index ?? 0) >= MIN_CLAUSE_LENGTH,
      ) ?? null;
    const useSoftBoundary = softMatch && softMatch.index >= MIN_CLAUSE_LENGTH;
    const match =
      strongMatch && (!useSoftBoundary || strongMatch.index < softMatch.index)
        ? strongMatch
        : useSoftBoundary
          ? softMatch
          : null;
    if (!match || match.index === undefined) break;
    const end = match.index + match[0].length;
    // Keep adjacent closing quotes with the sentence rather than starting a new audio clip.
    let boundary = end;
    while (boundary < remainder.length && /[」』”’"')\]]/u.test(remainder[boundary])) boundary++;
    const sentence = remainder.slice(0, boundary).trim();
    if (sentence) segments.push(sentence);
    remainder = remainder.slice(boundary).trimStart();
  }

  return { segments, remainder };
}
