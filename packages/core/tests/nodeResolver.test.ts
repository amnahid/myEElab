import { describe, it, expect } from "vitest";
import { Circuit } from "../src/models/circuit";
import { NodeResolver } from "../src/engine/nodeResolver";

describe("NodeResolver", () => {
  it("should map a simple 2-point wire to a single node", () => {
    const circuit: Circuit = {
      id: "c1",
      name: "Wire",
      components: [],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    // Should assign a non-zero node name since no ground is attached
    expect(result.wires.get("w1")).toBeDefined();
    expect(result.wires.get("w1")).not.toBe("0");
  });

  it("should merge intersecting wires into the same node", () => {
    const circuit: Circuit = {
      id: "c2",
      name: "Intersection",
      components: [],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] },
        { id: "w2", points: [{ x: 10, y: 0 }, { x: 10, y: 10 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    const node1 = result.wires.get("w1");
    const node2 = result.wires.get("w2");
    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1).toBe(node2); // They share the point (10,0)
  });

  it("should isolate independent unconnected nets", () => {
    const circuit: Circuit = {
      id: "c3",
      name: "Independent",
      components: [],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] },
        { id: "w2", points: [{ x: 20, y: 20 }, { x: 30, y: 20 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    const node1 = result.wires.get("w1");
    const node2 = result.wires.get("w2");
    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1).not.toBe(node2); // Distinct nets
  });

  it("should enforce node 0 for any net connected to a ground component", () => {
    const circuit: Circuit = {
      id: "c4",
      name: "Ground",
      components: [
        { id: "g1", type: "ground", position: { x: 10, y: 0 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: -20 }, { x: 10, y: -20 }] }
      ],
      analyses: []
    };

    // Note: ground component has pin "1" at offset (0, -20)
    // So its pin is at position (10, -20). 
    // Wire w1 goes from (0, -20) to (10, -20). It connects to the ground pin!
    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    expect(result.wires.get("w1")).toBe("0");
    expect(result.components.get("g1")?.get("1")).toBe("0");
  });

  it("should correctly map pin offsets for rotated and mirrored components", () => {
    // A resistor has pins at (0, -20) and (0, 20).
    // Let's place it at (100, 100).
    // Rotation 90 degrees clockwise -> pins should be at (-20, 0) and (20, 0) relative to origin.
    // So absolute: (80, 100) and (120, 100).
    const circuit: Circuit = {
      id: "c5",
      name: "Rotated",
      components: [
        { id: "r1", type: "resistor", position: { x: 100, y: 100 }, rotation: 90, mirrored: false, params: {} },
        // A mirrored VSource. Normal pins: + at (0, -20), - at (0, 20). 
        // With mirroring (scaleX = -1), the x offset is flipped, but since it's 0, it stays 0.
        // Let's test a fake component with non-zero X offset if possible, but vsource is standard.
        // Actually, let's just mirror a rotated resistor.
        // Rotation 90 -> relative pins (-20, 0) and (20, 0).
        // If mirrored AND rotated 90, mirrored flips X offset first. 
        // Original X offset is 0, so mirrored X offset is 0. 
        // Rotation by 90 maps (0, -20) to (20, 0)? Wait.
        // cos(90) = 0, sin(90) = 1.
        // x' = x*cos - y*sin = 0 - y(1) = -y. So (0, -20) becomes (20, 0).
        // y' = x*sin + y*cos = 0 + 0 = 0.
        // So (0, -20) -> (20, 0) relative, absolute (120, 100).
        { id: "r2", type: "resistor", position: { x: 200, y: 200 }, rotation: 90, mirrored: true, params: {} }
      ],
      wires: [
        // Connect to R1's first pin (should be at 120, 100 due to rotation math in nodeResolver)
        // Wait, nodeResolver math:
        // rotRad = 90 * PI / 180 = PI/2. cos = 0, sin = 1.
        // pin.offset = {x:0, y:-20}
        // rotatedOffsetX = 0*0 - (-20)*1 = 20.
        // rotatedOffsetY = 0*1 + (-20)*0 = 0.
        // So R1 pin 1 is at (120, 100).
        { id: "w1", points: [{ x: 120, y: 100 }] },
        
        // Connect to R2's first pin.
        // pin.offset = {x:0, y:-20}
        // mirroredOffsetX = 0.
        // rotatedOffsetX = 0*0 - (-20)*1 = 20.
        // rotatedOffsetY = 0*1 + (-20)*0 = 0.
        // R2 pin 1 is at (220, 200).
        { id: "w2", points: [{ x: 220, y: 200 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    // R1 pin "1" and w1 should share the same node
    const r1p1 = result.components.get("r1")?.get("1");
    const w1Node = result.wires.get("w1");
    expect(r1p1).toBeDefined();
    expect(w1Node).toBeDefined();
    expect(r1p1).toBe(w1Node);

    // R2 pin "1" and w2 should share the same node
    const r2p1 = result.components.get("r2")?.get("1");
    const w2Node = result.wires.get("w2");
    expect(r2p1).toBeDefined();
    expect(w2Node).toBeDefined();
    expect(r2p1).toBe(w2Node);
  });
  it("should not connect wires that cross over each other (degree 4)", () => {
    const circuit: Circuit = {
      id: "c-cross",
      name: "Crossing Wires",
      components: [],
      wires: [
        { id: "w-horiz", points: [{ x: 0, y: 10 }, { x: 20, y: 10 }] },
        { id: "w-vert", points: [{ x: 10, y: 0 }, { x: 10, y: 20 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    const nodeHoriz = result.wires.get("w-horiz");
    const nodeVert = result.wires.get("w-vert");
    expect(nodeHoriz).toBeDefined();
    expect(nodeVert).toBeDefined();
    expect(nodeHoriz).not.toBe(nodeVert); // 4-way crossing should NOT connect
  });

  it("should connect a wire that ends on the interior of another wire (T-junction)", () => {
    const circuit: Circuit = {
      id: "c-t-junction",
      name: "T-Junction",
      components: [],
      wires: [
        { id: "w-horiz", points: [{ x: 0, y: 10 }, { x: 20, y: 10 }] },
        { id: "w-vert", points: [{ x: 10, y: 0 }, { x: 10, y: 10 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    const nodeHoriz = result.wires.get("w-horiz");
    const nodeVert = result.wires.get("w-vert");
    expect(nodeHoriz).toBeDefined();
    expect(nodeVert).toBeDefined();
    expect(nodeHoriz).toBe(nodeVert); // T-junction should connect
  });

  it("should connect endpoints to pins even with slight sub-grid offsets", () => {
    const circuit: Circuit = {
      id: "c-offset",
      name: "Offset Snapping",
      components: [
        // Ground pin is at (10, -20)
        { id: "g1", type: "ground", position: { x: 10, y: 0 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        // Wire endpoint is at (13, -20), which is 3 pixels away from (10, -20).
        // It has a different pointId but should still be snapped and unioned!
        { id: "w1", points: [{ x: 30, y: -20 }, { x: 13, y: -20 }] }
      ],
      analyses: []
    };

    const resolver = new NodeResolver();
    const result = resolver.resolve(circuit);

    // Should connect to ground (node 0)
    expect(result.wires.get("w1")).toBe("0");
    expect(result.components.get("g1")?.get("1")).toBe("0");
  });
});
