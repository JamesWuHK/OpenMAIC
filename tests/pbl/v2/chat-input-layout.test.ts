import { describe, expect, it } from 'vitest';
import * as chat from '@/components/scene-renderers/pbl/v2/chat';

const inputHeight = (chat as unknown as { chatInputHeight?: (scrollHeight: number, width: number) => number | null }).chatInputHeight;
describe('chat input sizing across hidden panels', () => {
  it('does not measure a hidden textarea as a zero-height input', () => {
    expect(inputHeight?.(0, 0)).toBeNull();
  });
  it('retains at least one visible line after revealing the panel', () => {
    expect(inputHeight?.(0, 224)).toBe(24);
    expect(inputHeight?.(72, 224)).toBe(72);
  });
  it('caps long drafts while keeping the textarea scrollable', () => {
    expect(inputHeight?.(800, 224)).toBe(200);
  });
});
