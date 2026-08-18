import { Circuit, Wire, Point, ComponentInstance } from "../models/circuit";
import { ComponentLibrary } from "./library";
import { v4 as uuidv4 } from "uuid";
import { HOLES, getHolePosition, BOARD_WIDTH, BOARD_HEIGHT } from "../editor/breadboardLayout";

// Determine which group a hole belongs to. Holes in the same group are electrically connected.
export function getBreadboardGroup(holeId: string): string {
  // Rails: e.g. "pwr-top-+"
  if (holeId.startsWith("pwr-")) {
    return holeId;
  }
  // Rows: e.g. "1a", "30j"
  const match = holeId.match(/^(\d+)([a-j])$/);
  if (match) {
    const row = parseInt(match[1], 10);
    const col = match[2];
    // a-e are connected, f-j are connected
    if (['a', 'b', 'c', 'd', 'e'].includes(col)) {
      return `${row}-left`;
    } else {
      return `${row}-right`;
    }
  }
  return holeId; // fallback
}

// Compute the absolute schematic position of a component's pin
function getPinAbsolutePosition(comp: ComponentInstance, pinId: string): Point | null {
  const libComp = ComponentLibrary[comp.type];
  if (!libComp) return null;
  const pin = libComp.pins.find(p => p.id === pinId);
  if (!pin) return null;

  const mirroredOffsetX = comp.mirrored ? -pin.offset.x : pin.offset.x;
  const mirroredOffsetY = pin.offset.y;

  const rotRad = (comp.rotation || 0) * Math.PI / 180;
  const cos = Math.round(Math.cos(rotRad));
  const sin = Math.round(Math.sin(rotRad));
  
  const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
  const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;

  const basePos = comp.position;
  return {
    x: basePos.x + rotatedOffsetX,
    y: basePos.y + rotatedOffsetY
  };
}

// Derives implicit schematic wires (Ratlines) from breadboard placements
export function deriveBreadboardWires(circuit: Circuit): Wire[] {
  // Map Group ID -> List of Absolute Points in the Schematic
  const groupToPoints = new Map<string, Point[]>();

  const breadboards = circuit.components.filter(c => c.type === 'breadboard');

  const getHoleAtPosition = (p: Point): string | null => {
    for (const bb of breadboards) {
      const rotRad = (bb.rotation || 0) * Math.PI / 180;
      const cos = Math.round(Math.cos(rotRad));
      const sin = Math.round(Math.sin(rotRad));
      const bbX = bb.position.x;
      const bbY = bb.position.y;
      const dx = p.x - bbX;
      const dy = p.y - bbY;
      const unrotX = dx * cos + dy * sin;
      const unrotY = -dx * sin + dy * cos;
      const boardX = unrotX + BOARD_WIDTH / 2;
      const boardY = unrotY + BOARD_HEIGHT / 2;

      for (const hole of HOLES) {
        const pos = getHolePosition(hole.id);
        if (!pos) continue;
        const hdx = boardX - pos.x;
        const hdy = boardY - pos.y;
        if (Math.sqrt(hdx * hdx + hdy * hdy) < 5) {
          return hole.id;
        }
      }
    }
    return null;
  };

  for (const comp of circuit.components) {
    if (comp.type === 'breadboard') continue;
    const libComp = ComponentLibrary[comp.type];
    if (!libComp) continue;

    for (const pin of libComp.pins) {
      const absPos = getPinAbsolutePosition(comp, pin.id);
      if (absPos) {
        const holeId = getHoleAtPosition(absPos);
        if (holeId) {
          const group = getBreadboardGroup(holeId);
          if (!groupToPoints.has(group)) {
            groupToPoints.set(group, []);
          }
          if (!groupToPoints.get(group)!.some(pt => pt.x === absPos.x && pt.y === absPos.y)) {
             groupToPoints.get(group)!.push(absPos);
          }
        }
      }
    }
  }

  // Wires directly snapping to holes
  for (const wire of circuit.wires) {
     for (const p of wire.points) {
        const holeId = getHoleAtPosition(p);
        if (holeId) {
          const group = getBreadboardGroup(holeId);
          if (!groupToPoints.has(group)) {
            groupToPoints.set(group, []);
          }
          if (!groupToPoints.get(group)!.some(pt => pt.x === p.x && pt.y === p.y)) {
             groupToPoints.get(group)!.push(p);
          }
        }
     }
  }

  // 2. Resolve Jumper Wires using Union-Find
  const parent = new Map<string, string>();
  const find = (i: string): string => {
    if (!parent.has(i)) parent.set(i, i);
    if (parent.get(i) !== i) parent.set(i, find(parent.get(i)!));
    return parent.get(i)!;
  };
  const union = (i: string, j: string) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent.set(rootI, rootJ);
    }
  };

  // Initially, each hole group is its own root
  for (const group of groupToPoints.keys()) {
    find(group);
  }

  // Union groups connected by jumpers
  if (circuit.breadboard?.jumperWires) {
    for (const jumper of circuit.breadboard.jumperWires) {
      const startGroup = getBreadboardGroup(jumper.startHole);
      const endGroup = getBreadboardGroup(jumper.endHole);
      union(startGroup, endGroup);
    }
  }

  // 3. Aggregate points by their resolved root
  const rootToPoints = new Map<string, Point[]>();
  for (const [group, points] of groupToPoints.entries()) {
    const root = find(group);
    if (!rootToPoints.has(root)) {
      rootToPoints.set(root, []);
    }
    rootToPoints.get(root)!.push(...points);
  }

  const derivedWires: Wire[] = [];

  // 4. Emit ratline Wires for each connected root (star topology)
  for (const points of rootToPoints.values()) {
    if (points.length < 2) continue;
    
    const p0 = points[0];
    for (let i = 1; i < points.length; i++) {
      derivedWires.push({
        id: `ratline-${uuidv4()}`,
        points: [p0, points[i]]
      });
    }
  }

  return derivedWires;
}
