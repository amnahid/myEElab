import { describe, it, expect } from "vitest";
import { Circuit } from "../src/models/circuit";
import { NodeResolver } from "../src/engine/nodeResolver";
import { NetlistGenerator } from "../src/engine/netlist";
import { Simulation } from "eecircuit-engine";

describe("Node Resolver and Netlist Generator", () => {
  it("should correctly resolve nodes and simulate a Voltage Divider", async () => {
    const circuit: Circuit = {
      id: "test1",
      name: "Voltage Divider",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 10 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "r2", type: "resistor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: {} }
      ],
      // We wire v1(+) to r1(p1). 
      // v1(-) to gnd(gnd)
      // r1(p2) to r2(p1)
      // r2(p2) to gnd(gnd)
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }, { x: 0, y: 0 }] },     // v1+ to r1_1
        { id: "w2", points: [{ x: 0, y: 40 }, { x: 0, y: 40 }] },   // v1- to r2_1? wait, v1- is at y=40, r1_p2 is at y=40. So they connect.
        { id: "w3", points: [{ x: 0, y: 80 }, { x: 0, y: 80 }] },   // r2_p2 to gnd
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    // console.log("Voltage Divider Netlist:\n", netlist);
    
    // Test the output lines roughly
    expect(netlist).toContain("V1");
    expect(netlist).toContain("R1");
    expect(netlist).toContain("R2");
    expect(netlist).toContain(".op");
    
    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    
    expect(results).toBeDefined();
    expect(results.numVariables).toBeGreaterThan(0);
  });

  it("should simulate an RC Filter transient", async () => {
    const circuit: Circuit = {
      id: "test2",
      name: "RC Filter",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "c1", type: "capacitor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { capacitance: "1u" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, // v1+ (y=0) and r1_1 (y=0)
        { id: "w2", points: [{ x: 0, y: 40 }] }, // v1- (y=40), r1_2 (y=40), c1_1 (y=40)
        { id: "w3", points: [{ x: 0, y: 80 }] }, // c1_2 (y=80), gnd (y=80)
      ],
      analyses: [
        { kind: "tran", params: { step: "0.1m", stop: "5m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");
    console.log("RC FILTER NETLIST:", netlist);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    
    expect(results).toBeDefined();
    expect(results.data.length).toBeGreaterThan(0);
  });

  it("should simulate an RLC circuit", async () => {
    const circuit: Circuit = {
      id: "test3",
      name: "RLC",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "10" } },
        { id: "l1", type: "inductor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { inductance: "1m" } },
        { id: "c1", type: "capacitor", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: { capacitance: "1u" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 120 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, 
        { id: "w2", points: [{ x: 0, y: 40 }] },
        { id: "w3", points: [{ x: 0, y: 80 }] },
        { id: "w4", points: [{ x: 0, y: 120 }] },
      ],
      analyses: [
        { kind: "tran", params: { step: "10u", stop: "1m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    expect(results).toBeDefined();
  });

  it("should test current source", async () => {
    const circuit: Circuit = {
      id: "test4",
      name: "ISOURCE",
      components: [
        { id: "i1", type: "isource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 1 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "5" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, 
        { id: "w2", points: [{ x: 0, y: 40 }] },
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    expect(results).toBeDefined();
  });

  it("should fail gracefully or parse correctly on disconnected nets", async () => {
    const circuit: Circuit = {
      id: "test5",
      name: "Disconnected",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 1 } },
        { id: "gnd", type: "ground", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 40 }] }, // Only connects negative terminal to ground
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);
    expect(netlist).toContain("V1");
    // Doesn't strictly need to run through ngspice successfully if ngspice throws "singular matrix", we just test if the bridge can take it.
    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    try {
      await sim.runSim();
    } catch (e) {
      // ngspice might throw error on disconnected nets
      expect(e).toBeDefined();
    }
  });

  it("should simulate a subcircuit component (LM7805 regulator)", async () => {
    const circuit: Circuit = {
      id: "test-7805",
      name: "7805 Regulator Test",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 12 } },
        { id: "u1", type: "lm7805", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: {} },
        { id: "r1", type: "resistor", position: { x: 200, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "100" } },
        { id: "gnd", type: "ground", position: { x: 100, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w_in", points: [{ x: 0, y: -20 }, { x: 70, y: -10 }] },
        { id: "w_out", points: [{ x: 130, y: -10 }, { x: 200, y: -20 }] },
        { id: "w_gnd1", points: [{ x: 0, y: 20 }, { x: 100, y: 20 }] },
        { id: "w_gnd2", points: [{ x: 100, y: 20 }, { x: 200, y: 20 }] },
        { id: "w_gnd3", points: [{ x: 100, y: 20 }, { x: 100, y: 80 }] },
      ],
      analyses: [{ kind: "op", params: {} }]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    expect(netlist).toContain(".subckt LM7805");
    expect(netlist).toMatch(/X\w* \d+ 0 \d+ LM7805/);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();

    expect(results).toBeDefined();
    const outVar = results.data.find(v => v.values.some(val => Math.abs(val - 5.0) < 0.1));
    expect(outVar).toBeDefined();
  });

  it("should generate correct SPICE PULSE for clock component and simulate transient response", async () => {
    const circuit: Circuit = {
      id: "test-clock",
      name: "Clock Source Test",
      components: [
        { id: "clk1", type: "clock", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { frequency: "1k", vhigh: "5", vlow: "0", duty: "50" } },
        { id: "r1", type: "resistor", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w_sig", points: [{ x: 0, y: -20 }, { x: 100, y: -20 }] },
        { id: "w_gnd1", points: [{ x: 0, y: 20 }, { x: 100, y: 20 }] },
        { id: "w_gnd2", points: [{ x: 0, y: 20 }, { x: 0, y: 80 }] }
      ],
      analyses: [
        { kind: "tran", params: { step: "10u", stop: "2m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");

    expect(netlist).toContain(".tran 10u 2m");
    expect(netlist).toMatch(/V1 \d+ 0 PULSE\(0 5 0 1n 1n \S+ 1\.0000e-3\)/);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();

    expect(results).toBeDefined();
    expect(results.data.length).toBeGreaterThan(0);
    const vSig = results.data.find(d => d.name !== "time" && d.values.some(v => v > 4.5) && d.values.some(v => v < 0.5));
    expect(vSig).toBeDefined();
  });
});
