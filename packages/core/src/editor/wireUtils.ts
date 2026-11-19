import { Point } from '../models/circuit';

/**
 * Removes duplicate consecutive points and collapses collinear segments.
 */
export function simplifyWirePoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  // 1. Remove duplicate adjacent points
  const noDups: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = noDups[noDups.length - 1];
    if (Math.abs(points[i].x - prev.x) > 0.01 || Math.abs(points[i].y - prev.y) > 0.01) {
      noDups.push(points[i]);
    }
  }

  if (noDups.length <= 2) return noDups;

  // 2. Remove collinear intermediate points
  const result: Point[] = [noDups[0]];
  for (let i = 1; i < noDups.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = noDups[i];
    const next = noDups[i + 1];

    // Collinear horizontally
    const isCollinearH = Math.abs(prev.y - curr.y) < 0.01 && Math.abs(curr.y - next.y) < 0.01;
    // Collinear vertically
    const isCollinearV = Math.abs(prev.x - curr.x) < 0.01 && Math.abs(curr.x - next.x) < 0.01;

    if (!isCollinearH && !isCollinearV) {
      result.push(curr);
    }
  }
  result.push(noDups[noDups.length - 1]);

  return result;
}

/**
 * Moves an edge (segment) of a wire orthogonal to its direction:
 * - Vertical segments move horizontally (delta.dx).
 * - Horizontal segments move vertically (delta.dy).
 * 
 * Preserves 90-degree orthogonal routing and endpoints.
 * When isSnapEnd is true, collapses redundant collinear points.
 */
export function moveWireSegment(
  points: Point[],
  segIndex: number,
  delta: { dx: number; dy: number },
  isSnapEnd: boolean = false
): Point[] {
  if (points.length < 2 || segIndex < 0 || segIndex >= points.length - 1) {
    return points;
  }

  const p1 = points[segIndex];
  const p2 = points[segIndex + 1];

  const isHorizontal = Math.abs(p2.y - p1.y) <= Math.abs(p2.x - p1.x);
  const isVertical = !isHorizontal;

  const effDx = isVertical ? delta.dx : 0;
  const effDy = isHorizontal ? delta.dy : 0;

  if (effDx === 0 && effDy === 0) {
    return points;
  }

  const n = points.length;
  const isFirst = segIndex === 0;
  const isLast = segIndex === n - 2;
  const isInterior = !isFirst && !isLast;

  let newPoints: Point[] = [];

  if (isInterior) {
    // Interior segment: simply shift both corner vertices
    newPoints = points.map((p, idx) => {
      if (idx === segIndex || idx === segIndex + 1) {
        return { x: p.x + effDx, y: p.y + effDy };
      }
      return { ...p };
    });
  } else if (isFirst && isLast) {
    // Single segment (2 points): P0 -> P1
    // Insert 2 bends so endpoints stay anchored at their connections
    newPoints = [
      { ...points[0] },
      { x: points[0].x + effDx, y: points[0].y + effDy },
      { x: points[1].x + effDx, y: points[1].y + effDy },
      { ...points[1] }
    ];
  } else if (isFirst) {
    // First segment (P0 -> P1) in a multi-segment wire:
    // P0 stays anchored, insert a bend at (P0.x + effDx, P0.y + effDy)
    newPoints = [
      { ...points[0] },
      { x: points[0].x + effDx, y: points[0].y + effDy },
      { x: points[1].x + effDx, y: points[1].y + effDy },
      ...points.slice(2).map(p => ({ ...p }))
    ];
  } else if (isLast) {
    // Last segment (P_{n-2} -> P_{n-1}) in a multi-segment wire:
    // P_{n-1} stays anchored, insert a bend before P_{n-1}
    newPoints = [
      ...points.slice(0, n - 2).map(p => ({ ...p })),
      { x: points[n - 2].x + effDx, y: points[n - 2].y + effDy },
      { x: points[n - 1].x + effDx, y: points[n - 1].y + effDy },
      { ...points[n - 1] }
    ];
  }

  if (isSnapEnd) {
    return simplifyWirePoints(newPoints);
  }

  return newPoints;
}

/**
 * Calculates scale factor for text and badge labels to maintain static screen size
 * when zooming in from standard zoom scale (scale >= 1.0).
 * 
 * At scale >= 1.0, returns 1 / scale so that (scale * textScale) = 1.0 (static screen size).
 * At scale < 1.0 (zoomed out), returns 1.0 so labels shrink naturally with components.
 */
export function getTextScale(scale?: number): number {
  const currentScale = (scale && scale > 0) ? scale : 1;
  return 1 / Math.max(1, currentScale);
}

