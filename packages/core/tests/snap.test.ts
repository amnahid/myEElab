import { describe, it, expect } from 'vitest';
import { getMagneticSnapPosition } from '../src/editor/snapUtils';
import { Circuit } from '../src/models/circuit';

describe('getMagneticSnapPosition', () => {
  const sampleCircuit: Circuit = {
    components: [
      {
        id: 'u1',
        type: '74hc164',
        position: { x: 100, y: 100 },
        rotation: 0,
        mirrored: false,
        params: {}
      }
    ],
    wires: [
      {
        id: 'w1',
        points: [
          { x: 250, y: 50 },
          { x: 250, y: 250 }
        ]
      }
    ]
  };

  // In 74HC164:
  // Pin "4" (Q1) is at offset { x: 70, y: -30 }
  // With component position at (100, 100), Pin 4 absolute position is (170, 70).
  // Pin "3" (Q0) is at offset { x: 70, y: -50 } -> abs (170, 50).
  // Pin "5" (Q2) is at offset { x: 70, y: -10 } -> abs (170, 90).

  it('snaps to pin when close in normal 1.0 zoom', () => {
    // Within 8 units of Pin 4 (170, 70)
    const snap = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 175, y: 70 },
      scale: 1.0
    });
    expect(snap).toEqual({ x: 170, y: 70 });
  });

  it('does NOT snap to pin when cursor is far (e.g. 25 units away)', () => {
    // 25 units away: previously 30 would have snapped, now it should not snap
    const snap = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 195, y: 70 },
      scale: 1.0
    });
    expect(snap).toBeNull();
  });

  it('reduces world snapping distance when zoomed in (scale = 2.5)', () => {
    // At scale = 2.5:
    // pointThreshold is 12 / 2.5 = 4.8 units.
    // 8 units away (x=178, y=70) should NOT snap at 2.5x zoom
    const snapFarAtZoom = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 178, y: 70 },
      scale: 2.5
    });
    expect(snapFarAtZoom).toBeNull();

    // But 3 units away (x=173, y=70) SHOULD snap at 2.5x zoom
    const snapCloseAtZoom = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 173, y: 70 },
      scale: 2.5
    });
    expect(snapCloseAtZoom).toEqual({ x: 170, y: 70 });
  });

  it('does not snap across adjacent IC pins when zoomed out (scale = 0.5)', () => {
    // Midpoint between Pin 4 (170, 70) and Pin 5 (170, 90) is (170, 80).
    // Distance to each pin is 10 units.
    // At scale = 0.5, pointThreshold is clamped to 14 max.
    // A point at (170, 80) is 10 units away from both.
    // But a point at (170, 86) is 16 units from Pin 4 and 4 units from Pin 5.
    // It should snap to Pin 5, not Pin 4.
    const snap = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 170, y: 86 },
      scale: 0.5
    });
    expect(snap).toEqual({ x: 170, y: 90 });
  });

  it('prioritizes pins over nearby wire segments', () => {
    // Wire w1 runs vertically at x=250 from y=50 to 250.
    // Add another wire right near Pin 4 at x=176 (6 units from pin 4 at 170, 70).
    const circuitWithCloseWire: Circuit = {
      ...sampleCircuit,
      wires: [
        {
          id: 'w_close',
          points: [
            { x: 176, y: 20 },
            { x: 176, y: 120 }
          ]
        }
      ]
    };

    // Cursor at (174, 70):
    // Distance to Pin 4 (170, 70) is 4 units.
    // Distance to wire segment (at x=176, y=70) is 2 units.
    // Pin must win because discrete points take priority!
    const snap = getMagneticSnapPosition({
      circuit: circuitWithCloseWire,
      rawPos: { x: 174, y: 70 },
      scale: 1.0
    });
    expect(snap).toEqual({ x: 170, y: 70 });
  });

  it('snaps to wire segment only when close and no pin is in range', () => {
    // Wire w1 is at x=250.
    // Cursor at (247, 100): distance is 3 units, should snap to (250, 100)
    const snapClose = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 247, y: 100 },
      scale: 1.0
    });
    expect(snapClose).toEqual({ x: 250, y: 100 });

    // Cursor at (235, 100): distance is 15 units, must NOT snap to wire segment
    const snapFar = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 235, y: 100 },
      scale: 1.0
    });
    expect(snapFar).toBeNull();
  });

  it('ignores the wire point currently being dragged', () => {
    // Dragging point 0 of wire w1 at (250, 50)
    const snap = getMagneticSnapPosition({
      circuit: sampleCircuit,
      rawPos: { x: 250, y: 50 },
      scale: 1.0,
      ignorePoint: { wireId: 'w1', index: 0 }
    });
    // Should not snap to itself! (Point 1 is at 250, 250 which is 200 units away)
    // And segment from index 0 to 1 is ignored when dragging index 0.
    expect(snap).toBeNull();
  });
});
