import { Circuit } from '../models/circuit';
import { ComponentLibrary } from '../engine/library';

export interface MagneticSnapOptions {
  circuit: Circuit;
  rawPos: { x: number; y: number };
  scale?: number;
  mode?: string;
  screenDist?: number;
  ignorePoint?: { wireId: string; index: number };
}

/**
 * Calculates magnetic snapping for pins, wire vertices, and wire segments (T-junctions).
 * Distances are screen-pixel-based and scale inversely with canvas zoom level:
 * - When zoomed in, the world-space snap distance decreases, allowing fine control in tight areas.
 * - When zoomed out, snap distance is capped so it never jumps across adjacent pins (e.g. 20-unit IC pitch).
 * - Discrete points (pins and wire vertices) take strict priority over continuous wire segments.
 */
export function getMagneticSnapPosition({
  circuit,
  rawPos,
  scale = 1,
  mode = 'wire',
  screenDist,
  ignorePoint
}: MagneticSnapOptions): { x: number; y: number } | null {
  const currentScale = Math.max(0.1, scale || 1);
  const effectiveScreenDist = screenDist !== undefined ? screenDist : (mode === 'select' ? 9 : 12);

  // Pin / vertex threshold: scales with zoom, min 3.5 to cover pin body, max 14 to avoid neighbor pins.
  const pointThreshold = Math.min(14, Math.max(3.5, effectiveScreenDist / currentScale));
  // Wire segment threshold (for T-junctions): tighter so passing wires don't hijack the cursor.
  const segThreshold = Math.min(8, Math.max(2.5, (effectiveScreenDist * 0.65) / currentScale));

  let closestPointDist = pointThreshold;
  let snapPos: { x: number; y: number } | null = null;

  // 1. Check all component pins
  for (const comp of circuit.components) {
    const libComp = ComponentLibrary[comp.type];
    if (!libComp) continue;

    const renderRot = comp.rotation || 0;
    const rotRad = (renderRot * Math.PI) / 180;
    const cos = Math.round(Math.cos(rotRad));
    const sin = Math.round(Math.sin(rotRad));

    for (const pin of libComp.pins) {
      const baseOffset = pin.offset;
      const mirroredOffsetX = comp.mirrored ? -baseOffset.x : baseOffset.x;
      const mirroredOffsetY = baseOffset.y;

      const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
      const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;

      const renderPos = comp.position;
      const pinAbsX = renderPos.x + rotatedOffsetX;
      const pinAbsY = renderPos.y + rotatedOffsetY;

      const dist = Math.hypot(rawPos.x - pinAbsX, rawPos.y - pinAbsY);
      if (dist < closestPointDist) {
        closestPointDist = dist;
        snapPos = { x: pinAbsX, y: pinAbsY };
      }
    }
  }

  // 2. Check wire vertices (endpoints and bend points)
  for (const wire of circuit.wires) {
    for (let i = 0; i < wire.points.length; i++) {
      if (ignorePoint && ignorePoint.wireId === wire.id && ignorePoint.index === i) continue;

      const wp = wire.points[i];
      const dist = Math.hypot(rawPos.x - wp.x, rawPos.y - wp.y);
      if (dist < closestPointDist) {
        closestPointDist = dist;
        snapPos = { x: wp.x, y: wp.y };
      }
    }
  }

  // Discrete points (pins & wire vertices) take precedence over wire segments
  if (snapPos) {
    return snapPos;
  }

  // 3. Check wire segments for T-junctions
  let closestSegDist = segThreshold;
  for (const wire of circuit.wires) {
    for (let i = 1; i < wire.points.length; i++) {
      if (ignorePoint && ignorePoint.wireId === wire.id && (ignorePoint.index === i || ignorePoint.index === i - 1)) continue;

      const a = wire.points[i - 1];
      const b = wire.points[i];
      const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      if (l2 > 0) {
        let t = ((rawPos.x - a.x) * (b.x - a.x) + (rawPos.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = a.x + t * (b.x - a.x);
        const projY = a.y + t * (b.y - a.y);
        const distSeg = Math.hypot(rawPos.x - projX, rawPos.y - projY);
        if (distSeg < closestSegDist) {
          closestSegDist = distSeg;
          snapPos = { x: projX, y: projY };
        }
      }
    }
  }

  return snapPos;
}
