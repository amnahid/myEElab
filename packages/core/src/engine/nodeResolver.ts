import { Circuit, Point } from "../models/circuit";
import { ComponentLibrary } from "./library";

export class NodeResolver {
  private pointToNodeId = new Map<string, number>();
  private parent = new Map<number, number>();
  private nextNodeId = 1;

  private getPointKey(p: Point) {
    return `${p.x},${p.y}`;
  }

  private find(i: number): number {
    if (this.parent.get(i) === undefined) {
      this.parent.set(i, i);
    }
    if (this.parent.get(i) !== i) {
      this.parent.set(i, this.find(this.parent.get(i)!));
    }
    return this.parent.get(i)!;
  }

  private union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
    }
  }

  private addPoint(p: Point): number {
    const key = this.getPointKey(p);
    if (!this.pointToNodeId.has(key)) {
      this.pointToNodeId.set(key, this.nextNodeId++);
    }
    return this.pointToNodeId.get(key)!;
  }

  public resolve(circuit: Circuit, activeView: 'schematic' | 'breadboard' = 'schematic'): { components: Map<string, Map<string, string>>, wires: Map<string, string> } {
    // 1. Process all wires
    const wirePoints = new Map<string, number>();
    for (const wire of circuit.wires) {
      if (wire.points.length > 0) {
        const firstId = this.addPoint(wire.points[0]);
        wirePoints.set(wire.id, firstId);
        for (let i = 1; i < wire.points.length; i++) {
          const pointId = this.addPoint(wire.points[i]);
          this.union(firstId, pointId);
        }
      }
    }

    // 2. Identify all component pins and map them to points
    const compPins = new Map<string, Map<string, number>>();
    let groundRoot: number | null = null;

    for (const comp of circuit.components) {
      const libComp = ComponentLibrary[comp.type];
      if (!libComp) continue;

      const pinMap = new Map<string, number>();
      for (const pin of libComp.pins) {
        // Apply mirroring (flip horizontally)
        const baseOffset = (activeView === 'breadboard' && pin.breadboardOffset) ? pin.breadboardOffset : pin.offset;
        const mirroredOffsetX = comp.mirrored ? -baseOffset.x : baseOffset.x;
        const mirroredOffsetY = baseOffset.y;

        // Calculate absolute position considering rotation
        const rotRad = (comp.rotation || 0) * Math.PI / 180;
        const cos = Math.round(Math.cos(rotRad));
        const sin = Math.round(Math.sin(rotRad));
        
        const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
        const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;
        
        const absPoint = {
          x: comp.position.x + rotatedOffsetX,
          y: comp.position.y + rotatedOffsetY,
        };
        const pointId = this.addPoint(absPoint);
        pinMap.set(pin.id, pointId);

        // If this is a ground component, its point must map to node "0"
        if (comp.type === "ground" && pin.label === "gnd") {
          const root = this.find(pointId);
          if (groundRoot === null) {
            groundRoot = root;
          } else {
            this.union(groundRoot, root);
            groundRoot = this.find(groundRoot); // Update root after union
          }
        }
      }
      compPins.set(comp.id, pinMap);
    }

    // 3. Assign netlist names to roots
    const uniqueRoots = new Set<number>();
    for (const id of this.pointToNodeId.values()) {
      uniqueRoots.add(this.find(id));
    }

    const rootToName = new Map<number, string>();
    if (groundRoot !== null) {
        groundRoot = this.find(groundRoot);
        rootToName.set(groundRoot, "0");
    }

    let nextName = 1;
    for (const root of uniqueRoots) {
      if (!rootToName.has(root)) {
        rootToName.set(root, nextName.toString());
        nextName++;
      }
    }

    // 4. Build final mapping: compId -> pinId -> nodeName
    const finalMapping = new Map<string, Map<string, string>>();
    for (const comp of circuit.components) {
      const pins = compPins.get(comp.id);
      if (pins) {
        const pinNames = new Map<string, string>();
        for (const [pinId, internalId] of pins.entries()) {
          const root = this.find(internalId);
          const name = rootToName.get(root)!;
          pinNames.set(pinId, name);
        }
        finalMapping.set(comp.id, pinNames);
      }
    }

    // 5. Build wire mapping: wireId -> nodeName
    const wireMapping = new Map<string, string>();
    for (const [wireId, pointId] of wirePoints.entries()) {
      const root = this.find(pointId);
      const name = rootToName.get(root)!;
      wireMapping.set(wireId, name);
    }

    return { components: finalMapping, wires: wireMapping };
  }
}
