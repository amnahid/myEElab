import { describe, it, expect } from 'vitest';
import { moveWireSegment, simplifyWirePoints, getTextScale } from '../src/editor/wireUtils';
import { Point } from '../src/models/circuit';

describe('simplifyWirePoints', () => {
  it('removes duplicate consecutive points', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 }
    ];
    const simplified = simplifyWirePoints(points);
    expect(simplified).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 }
    ]);
  });

  it('collapses collinear intermediate points', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 100, y: 100 }
    ];
    const simplified = simplifyWirePoints(points);
    expect(simplified).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
  });
});

describe('moveWireSegment', () => {
  // Scenario matching user's screenshot:
  // 4-point wire: P0(70, 70) -> P1(120, 70) -> P2(120, 20) -> P3(170, 20)
  // Interior segment is vertical at x=120, between P1 and P2 (segIndex = 1)
  it('moves vertical interior segment horizontally in a 4-point wire', () => {
    const wirePoints: Point[] = [
      { x: 70, y: 70 },
      { x: 120, y: 70 },
      { x: 120, y: 20 },
      { x: 170, y: 20 }
    ];

    // Drag vertical segment 1 to the left by -30 (x goes from 120 to 90)
    const moved = moveWireSegment(wirePoints, 1, { dx: -30, dy: 15 }, false);
    // Notice dy should be ignored for vertical segments!
    expect(moved).toEqual([
      { x: 70, y: 70 },
      { x: 90, y: 70 },
      { x: 90, y: 20 },
      { x: 170, y: 20 }
    ]);
  });

  it('moves horizontal interior segment vertically in a 4-point wire', () => {
    const wirePoints: Point[] = [
      { x: 20, y: 20 },
      { x: 20, y: 80 },
      { x: 120, y: 80 },
      { x: 120, y: 140 }
    ];

    // Segment 1 is horizontal at y=80 between (20, 80) and (120, 80)
    // Drag it down by +20 (y goes from 80 to 100)
    const moved = moveWireSegment(wirePoints, 1, { dx: 15, dy: 20 }, false);
    // dx should be ignored for horizontal segments
    expect(moved).toEqual([
      { x: 20, y: 20 },
      { x: 20, y: 100 },
      { x: 120, y: 100 },
      { x: 120, y: 140 }
    ]);
  });

  it('inserts 2 bends when moving a straight 2-point wire', () => {
    const wirePoints: Point[] = [
      { x: 50, y: 100 },
      { x: 150, y: 100 }
    ];

    // Drag horizontal straight wire down by +30
    const moved = moveWireSegment(wirePoints, 0, { dx: 0, dy: 30 }, false);
    expect(moved).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 130 },
      { x: 150, y: 130 },
      { x: 150, y: 100 }
    ]);
  });

  it('collapses to straight line when moved back and isSnapEnd is true', () => {
    const wirePoints: Point[] = [
      { x: 50, y: 100 },
      { x: 120, y: 100 },
      { x: 120, y: 50 },
      { x: 180, y: 50 }
    ];

    // Drag vertical segment (segIndex=1, x=120) left by -70 to align with x=50
    const moved = moveWireSegment(wirePoints, 1, { dx: -70, dy: 0 }, true);
    // Points (50, 100) -> (50, 100) collapse, leaving:
    expect(moved).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 50 },
      { x: 180, y: 50 }
    ]);
  });
});

describe('getTextScale', () => {
  it('returns 1.0 at standard zoom scale (scale = 1.0)', () => {
    expect(getTextScale(1.0)).toBe(1.0);
  });

  it('maintains static screen size when zoomed in (scale >= 1.0)', () => {
    // scale = 2.0 -> textScale = 0.5 (net screen size: 2.0 * 0.5 = 1.0)
    expect(getTextScale(2.0)).toBe(0.5);
    expect(2.0 * getTextScale(2.0)).toBeCloseTo(1.0);

    // scale = 2.5 (from user screenshot) -> textScale = 0.4
    expect(getTextScale(2.5)).toBe(0.4);
    expect(2.5 * getTextScale(2.5)).toBeCloseTo(1.0);

    // scale = 4.0 -> textScale = 0.25
    expect(getTextScale(4.0)).toBe(0.25);
    expect(4.0 * getTextScale(4.0)).toBeCloseTo(1.0);
  });

  it('allows natural scaling down when zoomed out (scale < 1.0)', () => {
    // When zoomed out, labels shrink naturally with components so they do not overpower
    expect(getTextScale(0.8)).toBe(1.0);
    expect(getTextScale(0.5)).toBe(1.0);
    expect(getTextScale(0.25)).toBe(1.0);
  });

  it('safely handles edge cases like undefined, 0, or negative scales', () => {
    expect(getTextScale(undefined)).toBe(1.0);
    expect(getTextScale(0)).toBe(1.0);
    expect(getTextScale(-1.5)).toBe(1.0);
  });
});

