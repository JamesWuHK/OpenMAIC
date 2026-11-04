// Conservative comparison: retain scientific punctuation and numeric operators.
// Paired emphasis is only stripped when not adjacent to ASCII digits.
export function normalizeSpeechText(text){
 return text.normalize('NFKC')
  .replace(/(?<![0-9])\*\*([^\n]+?)\*\*(?![0-9])/g,'$1')
  .replace(/(?<![0-9])__([^\n]+?)__(?![0-9])/g,'$1')
  .replace(/`([^`\n]+)`/g,'$1')
  .replace(/\s+/gu,'');
}
