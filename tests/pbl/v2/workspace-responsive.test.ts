import { describe, expect, it } from 'vitest';
import * as workspace from '@/components/scene-renderers/pbl/v2/workspace';

const visibility = (workspace as unknown as {
  workspacePanelVisibility?: (width: number, selected: 'sidebar' | 'chat' | 'submission') => Record<string, boolean>;
}).workspacePanelVisibility;
const progressVisible = (workspace as unknown as {
  workspaceProgressVisible?: (width: number) => boolean;
}).workspaceProgressVisible;
const mobileTabMinHeight = (workspace as unknown as {
  MOBILE_WORKSPACE_TAB_MIN_HEIGHT?: number;
}).MOBILE_WORKSPACE_TAB_MIN_HEIGHT;
const mobileTabRowHeight = (workspace as unknown as {
  MOBILE_WORKSPACE_TAB_ROW_HEIGHT?: number;
}).MOBILE_WORKSPACE_TAB_ROW_HEIGHT;

describe('PBL responsive panels', () => {
  it('gives a phone a single readable task panel', () => {
    expect(visibility?.(390, 'submission')).toEqual({ sidebar: false, chat: false, submission: true });
  });
  it('allows the learner to reach chat or the route without discarding another panel', () => {
    expect(visibility?.(390, 'chat')).toEqual({ sidebar: false, chat: true, submission: false });
    expect(visibility?.(390, 'sidebar')).toEqual({ sidebar: true, chat: false, submission: false });
  });
  it('keeps all three columns at the desktop breakpoint', () => {
    expect(visibility?.(768, 'submission')).toEqual({ sidebar: true, chat: true, submission: true });
    expect(visibility?.(1280, 'chat')).toEqual({ sidebar: true, chat: true, submission: true });
  });
  it('hides the desktop progress strip whenever the workspace itself is compact', () => {
    expect(progressVisible?.(390)).toBe(false);
    expect(progressVisible?.(767)).toBe(false);
    expect(progressVisible?.(768)).toBe(true);
  });
  it('keeps mobile workspace tabs at the course QA touch target', () => {
    expect(mobileTabMinHeight).toBe(55);
    expect(mobileTabRowHeight).toBe(64);
  });
});
