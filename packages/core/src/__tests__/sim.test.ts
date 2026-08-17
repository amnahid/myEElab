import { describe, it, expect } from 'vitest';
import { NetlistGenerator } from '../engine/netlist';
import { NodeResolver } from '../engine/nodeResolver';
import { Circuit } from '../models/circuit';

describe('Simulation & Netlist Tests', () => {
  it('resolves nodes for connected circuit', () => {
    const circuit: Circuit = {
      id: "test",
      name: "Test Circuit",
      components: [
        { id: "v1", type: "vsource", position: { x: 100, y: 100 }, rotation: 0, mirrored: false, params: { dc: "5", type: "dc" } },
        { id: "r1", type: "resistor", position: { x: 200, y: 100 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "g1", type: "ground", position: { x: 100, y: 200 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 100, y: 80 }, { x: 200, y: 80 }] },
        { id: "w2", points: [{ x: 100, y: 120 }, { x: 200, y: 120 }] },
        { id: "w3", points: [{ x: 100, y: 120 }, { x: 100, y: 180 }] }
      ],
      analyses: [{ kind: "op", params: {} }]
    };

    const resolver = new NodeResolver();
    const resolved = resolver.resolve(circuit);
    
    console.log("Resolved components:", resolved.components);
    console.log("Resolved wires:", resolved.wires);

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "op");
    console.log("Netlist:\n", netlist);
    
    expect(netlist).toContain("V1 1 0 DC 5");
    expect(netlist).toContain("R1 1 0 1k");
  });
});
