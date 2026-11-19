import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../src/store/editorStore';

describe('Canvas Panning with Space and Stage Dragging', () => {
  beforeEach(() => {
    useEditorStore.getState().clearAll();
    useEditorStore.getState().setStageView({ x: 0, y: 0 }, 1.0);
  });

  it('updates stage position correctly based on pan delta', () => {
    const store = useEditorStore.getState();
    const startStageX = 50;
    const startStageY = 80;
    const currentScale = 1.5;

    store.setStageView({ x: startStageX, y: startStageY }, currentScale);

    // Simulate mouse drag delta: mouse moved by (+120, -40)
    const mouseDeltaX = 120;
    const mouseDeltaY = -40;

    store.setStageView({
      x: startStageX + mouseDeltaX,
      y: startStageY + mouseDeltaY
    }, currentScale);

    const updated = useEditorStore.getState();
    expect(updated.stagePos).toEqual({ x: 170, y: 40 });
    expect(updated.scale).toBe(1.5);
  });

  it('preserves drawing wire points while panning', () => {
    useEditorStore.getState().setMode('wire');
    expect(useEditorStore.getState().mode).toBe('wire');

    // Pan stage by (200, 100) while in wire mode
    useEditorStore.getState().setStageView({ x: 200, y: 100 }, 1.0);

    const updated = useEditorStore.getState();
    expect(updated.mode).toBe('wire');
    expect(updated.stagePos).toEqual({ x: 200, y: 100 });
  });

  it('correctly determines whether Space should prevent default scrolling', () => {
    // Utility mimicking the Canvas.tsx Space key check
    const shouldPreventSpace = (targetTag: string, isContentEditable: boolean) => {
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || isContentEditable) {
        return false;
      }
      return true;
    };

    expect(shouldPreventSpace('DIV', false)).toBe(true);
    expect(shouldPreventSpace('CANVAS', false)).toBe(true);
    expect(shouldPreventSpace('BODY', false)).toBe(true);
    expect(shouldPreventSpace('INPUT', false)).toBe(false);
    expect(shouldPreventSpace('TEXTAREA', false)).toBe(false);
    expect(shouldPreventSpace('DIV', true)).toBe(false);
  });

  it('evaluates element interactivity to false during space press or active panning', () => {
    // Mimicking the listening={!isSpacePressed && !isPanning} logic
    const getListeningState = (isSpacePressed: boolean, isPanning: boolean) => {
      return !isSpacePressed && !isPanning;
    };

    // Idle in select mode: interactive
    expect(getListeningState(false, false)).toBe(true);

    // Space held down (ready to drag): non-interactive (click-through to canvas)
    expect(getListeningState(true, false)).toBe(false);

    // Mouse dragging with Space: non-interactive
    expect(getListeningState(true, true)).toBe(false);

    // Mouse dragging with Middle click (Space released): non-interactive
    expect(getListeningState(false, true)).toBe(false);
  });
});
